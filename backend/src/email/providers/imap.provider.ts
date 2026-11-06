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

const RESUME_EXTENSIONS = ['.pdf', '.docx'];

@Injectable()
export class ImapProvider extends EventEmitter {
  private readonly logger = new Logger(ImapProvider.name);

  private normalizeStr(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  async fetchUnread(
    config: ImapConfig,
    subjectFilter?: string,
    limit?: number,
  ): Promise<{ messages: EmailMessage[]; totalUnseen: number; remaining: number }> {
    return new Promise((outerResolve, outerReject) => {
      // Garante que a promise só é resolvida/rejeitada uma vez, mesmo que a lib
      // emita vários eventos (ex.: erro após o fim da conexão).
      let settled = false;
      const resolve = (v: { messages: EmailMessage[]; totalUnseen: number; remaining: number }) => {
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
              imap.end();
              return resolve({ messages: [], totalUnseen: 0, remaining: 0 });
            }

            const totalUnseen = uids.length;
            const targetUids = limit ? uids.slice(0, limit) : uids;

            this.logger.log(`Encontrados ${totalUnseen} e-mail(s) não lidos — processando ${targetUids.length}`);

            const fetch = imap.fetch(targetUids, { bodies: '' });
            const pending: Promise<void>[] = [];

            fetch.on('message', (msg: NodeJS.EventEmitter, seqno: number) => {
              const p = new Promise<void>((res) => {
                const chunks: Buffer[] = [];

                msg.on('body', (stream: NodeJS.ReadableStream) => {
                  stream.on('data', (chunk: Buffer) => chunks.push(chunk));
                  stream.once('end', async () => {
                    try {
                      const raw = Buffer.concat(chunks);
                      const parsed = await simpleParser(raw);
                      const subject = parsed.subject ?? '';

                      if (subjectFilter) {
                        const norm = this.normalizeStr.bind(this);
                        if (!norm(subject).includes(norm(subjectFilter))) {
                          this.logger.log(`E-mail ignorado (assunto não contém "${subjectFilter}"): "${subject}" — #${seqno}`);
                          return res();
                        }
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

                      if (attachments.length > 0) {
                        messages.push({
                          sender: parsed.from?.text ?? 'desconhecido',
                          senderEmail: parsed.from?.value?.[0]?.address ?? '',
                          subject,
                          receivedAt: parsed.date ?? new Date(),
                          attachments,
                        });
                      }
                    } catch (parseErr) {
                      this.logger.warn(`Erro ao processar mensagem #${seqno}: ${parseErr}`);
                    }

                    res();
                  });
                });
              });

              pending.push(p);
            });

            fetch.once('end', async () => {
              await Promise.all(pending);

              imap.addFlags(targetUids, '\\Seen', (flagErr: Error) => {
                if (flagErr) this.logger.warn(`Erro ao marcar como lido: ${flagErr}`);
                imap.end();
                resolve({ messages, totalUnseen, remaining: totalUnseen - targetUids.length });
              });
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
