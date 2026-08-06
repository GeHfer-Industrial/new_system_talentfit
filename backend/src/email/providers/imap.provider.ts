import { Injectable, Logger } from '@nestjs/common';
import { simpleParser } from 'mailparser';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ImapLib = require('imap');

export interface EmailAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  filePath: string;
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

  async fetchUnread(config: ImapConfig, uploadDir: string, subjectFilter?: string): Promise<EmailMessage[]> {
    return new Promise((resolve, reject) => {
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
              return resolve([]);
            }

            this.logger.log(`Encontrados ${uids.length} e-mail(s) não lidos`);

            const fetch = imap.fetch(uids, { bodies: '' });
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
                        const savePath = path.join(uploadDir, saveName);
                        fs.writeFileSync(savePath, att.content);

                        attachments.push({
                          filename: saveName,
                          originalName: att.filename ?? saveName,
                          mimeType: att.contentType,
                          filePath: savePath,
                        });

                        this.logger.log(`Anexo salvo: ${saveName}`);
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

              imap.addFlags(uids, '\\Seen', (flagErr: Error) => {
                if (flagErr) this.logger.warn(`Erro ao marcar como lido: ${flagErr}`);
                imap.end();
                resolve(messages);
              });
            });

            fetch.once('error', (fetchErr: Error) => {
              imap.end();
              reject(fetchErr);
            });
          });
        });
      });

      imap.once('error', (err: Error) => {
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

      imap.once('error', (err: Error) => {
        this.logger.warn(`Teste de conexão IMAP falhou: ${err.message}`);
        resolve(false);
      });

      imap.connect();
    });
  }
}
