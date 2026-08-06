import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class SmtpProvider {
  private readonly logger = new Logger(SmtpProvider.name);

  private createTransport(config: SmtpConfig) {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.password },
    });
  }

  async sendMail(config: SmtpConfig, options: SendMailOptions): Promise<void> {
    const transport = this.createTransport(config);
    await transport.sendMail({
      from: `"GEHFER - Recursos Humanos" <${config.user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }

  async testConnection(config: SmtpConfig): Promise<boolean> {
    try {
      await this.createTransport(config).verify();
      return true;
    } catch (err) {
      this.logger.warn(`Teste de conexão SMTP falhou: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }
}
