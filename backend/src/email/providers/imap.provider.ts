import { Injectable, Logger } from '@nestjs/common';
import { simpleParser } from 'mailparser';
import { EventEmitter } from 'events';
import * as path from 'path';
import { randomUUID } from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ImapLib = require('imap');

export interface EmailAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface EmailMessage {
  uid: number;
  sender: string;
  senderEmail: string;
  subject: string;
  receivedAt: Date;
  attachments: EmailAttachment[];
}

export interface ImapConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

/**
 * Resultado de uma busca de e-mails não lidos. A conexão IMAP continua aberta
 * para que cada e-mail seja marcado como lido só DEPOIS de processado — se a
 * função for interrompida (timeout da Vercel), os e-mails não processados
 * continuam como não lidos e entram na próxima sincronização.
 */
export interface UnreadFetchSession {
  messages: EmailMessage[];
  totalUnseen: number;
  markSeen(uids: number[]): Promise<void>;
  close(): void;
}

const RESUME_EXTENSIONS = ['.pdf', '.docx'];

@Injectable()
export class ImapProvider extends EventEmitter {
  private readonly logger = new Logger(ImapProvider.name);

  private normalizeStr(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /** Retorna os dados do e-mail, ou undefined se ele não deve ser processado. */
  private async parseMessage(
    raw: Buffer,
    subjectFilter: string | undefined,
    seqno: number,
  ): Promise<Omit<EmailMessage, 'uid'> | undefined> {
    try {
      const parsed = await simpleParser(raw);
      const subject = parsed.subject ?? '';

      if (subjectFilter && !this.normalizeStr(subject).includes(this.normalizeStr(subjectFilter))) {
        this.logger.log(`E-mail ignorado (assunto não contém "${subjectFilter}"): "${subject}" — #${seqno}`);
        return undefined;
      }

      const attachments: EmailAttachment[] = [];
      for (const att of parsed.attachments ?? []) {
        const ext = path.extname(att.filename ?? '').toLowerCase();
        if (!RESUME_EXTENSIONS.includes(ext)) continue;

        const saveName = `${randomUUID()}${ext}`;
        attachments.push({
          filename: saveName,
          originalName: att.filename ?? saveName,
          mimeType: att.contentType,
          buffer: att.content,
        });
        this.logger.log(`Anexo recebido: ${saveName}`);
      }

      if (!attachments.length) return undefined;

      return {
        sender: parsed.from?.text ?? 'desconhecido',
        senderEmail: parsed.from?.value?.[0]?.address ?? '',
        subject,
        receivedAt: parsed.date ?? new Date(),
        attachments,
      };
    } catch (parseErr) {
      this.logger.warn(`Erro ao processar mensagem #${seqno}: ${parseErr}`);
      return undefined;
    }
  }

  async fetchUnread(
    config: ImapConfig,
    subjectFilter?: string,
    limit?: number,
  ): Promise<UnreadFetchSession> {
    return new Promise((outerResolve, outerReject) => {
      // Garante que a promise só é resolvida/rejeitada uma vez, mesmo que a lib
      // emita vários eventos (ex.: erro após o fim da conexão).
      let settled = false;
      const resolve = (v: UnreadFetchSession) => {
        if (settled) return;
        settled = true;
        outerResolve(v);
      };
      const reject = (e: unknown) => {
        if (settled) return;
        settled = true;
        outerReject(e);
      };

      const imap = new ImapLib({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.port === 993,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000,
        authTimeout: 10000,
      });

      const messages: EmailMessage[] = [];
      // E-mails que não serão processados (assunto fora do filtro, sem anexo de
      // currículo, erro de parse) — marcados como lidos já na busca.
      const skippedUids: number[] = [];

      const close = () => {
        try {
          imap.end();
        } catch {
          /* conexão já encerrada */
        }
      };
      const markSeen = (uidsToMark: number[]) =>
        new Promise<void>((res) => {
          if (!uidsToMark.length) return res();
          imap.addFlags(uidsToMark, '\\Seen', (flagErr: Error) => {
            if (flagErr) this.logger.warn(`Erro ao marcar como lido (${uidsToMark.join(',')}): ${flagErr}`);
            res();
          });
        });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err: Error) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          imap.search(['UNSEEN'], (searchErr: Error, uids: number[]) => {
            if (searchErr) {
              imap.end();
              return reject(searchErr);
            }

            if (!uids || !uids.length) {
              close();
              return resolve({ messages: [], totalUnseen: 0, markSeen: async () => {}, close: () => {} });
            }

            const totalUnseen = uids.length;
            const targetUids = limit ? uids.slice(0, limit) : uids;

            this.logger.log(`Encontrados ${totalUnseen} e-mail(s) não lidos — processando ${targetUids.length}`);

            const fetch = imap.fetch(targetUids, { bodies: '' });
            const pending: Promise<void>[] = [];

            fetch.on('message', (msg: NodeJS.EventEmitter, seqno: number) => {
              let uid: number | undefined;
              const attrsReady = new Promise<void>((resAttrs) => {
                msg.once('attributes', (attrs: { uid: number }) => {
                  uid = attrs.uid;
                  resAttrs();
                });
                msg.once('end', () => resAttrs());
              });

              const p = new Promise<void>((res) => {
                const chunks: Buffer[] = [];

                msg.on('body', (stream: NodeJS.ReadableStream) => {
                  stream.on('data', (chunk: Buffer) => chunks.push(chunk));
                  stream.once('end', async () => {
                    const parsedMessage = await this.parseMessage(Buffer.concat(chunks), subjectFilter, seqno);

                    await attrsReady;
                    if (uid === undefined) {
                      this.logger.warn(`Mensagem #${seqno} sem UID — ignorada`);
                    } else if (parsedMessage) {
                      messages.push({ uid, ...parsedMessage });
                    } else {
                      skippedUids.push(uid);
                    }
                    res();
                  });
                });
              });

              pending.push(p);
            });

            fetch.once('end', async () => {
              await Promise.all(pending);
              await markSeen(skippedUids);
              // Ordena do mais antigo para o mais novo (o fetch pode chegar fora de ordem).
              messages.sort((a, b) => a.uid - b.uid);
              resolve({ messages, totalUnseen: totalUnseen - skippedUids.length, markSeen, close });
            });

            fetch.once('error', (fetchErr: Error) => {
              imap.end();
              reject(fetchErr);
            });
          });
        });
      });

      // `on` (e não `once`): erros emitidos depois do primeiro — inclusive após
      // imap.end(), enquanto os anexos ainda estão sendo processados — não podem
      // ficar sem listener, senão derrubam o processo (500 na Vercel).
      imap.on('error', (err: Error) => {
        if (settled) {
          this.logger.warn(`Erro IMAP após o término da busca (ignorado): ${err.message}`);
          return;
        }
        this.logger.error(`Erro de conexão IMAP: ${err.message}`);
        reject(err);
      });

      imap.connect();
    });
  }

  async testConnection(config: ImapConfig): Promise<boolean> {
    return new Promise((resolve) => {
      const imap = new ImapLib({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.port === 993,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000,
        authTimeout: 10000,
      });

      imap.once('ready', () => {
        imap.end();
        resolve(true);
      });

      imap.on('error', (err: Error) => {
        this.logger.warn(`Teste de conexão IMAP falhou: ${err.message}`);
        resolve(false);
      });

      imap.connect();
    });
  }
}
