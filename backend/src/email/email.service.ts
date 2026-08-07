import { BadRequestException, Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ResumeService } from '../resume/resume.service';
import { ImapProvider } from './providers/imap.provider';
import { SmtpProvider } from './providers/smtp.provider';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailProtocol } from '@prisma/client';

export class UpsertEmailConfigDto {
  @ApiProperty()
  @IsString()
  host!: string;

  @ApiProperty()
  @IsInt()
  port!: number;

  @ApiProperty()
  @IsString()
  user!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ enum: EmailProtocol, default: EmailProtocol.IMAP })
  @IsEnum(EmailProtocol)
  protocol!: EmailProtocol;

  @ApiProperty({ default: true })
  @IsBoolean()
  active!: boolean;

  @ApiProperty({ required: false, description: 'Filtra e-mails pelo assunto (ex: curriculo)' })
  @IsOptional()
  @IsString()
  subjectFilter?: string;

  @ApiProperty({ required: false, description: 'Host SMTP para envio da resposta automática' })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiProperty({ required: false, description: 'Porta SMTP para envio da resposta automática' })
  @IsOptional()
  @IsInt()
  smtpPort?: number;

  @ApiProperty({ default: true, description: 'Envia automaticamente o link de pré-cadastro ao candidato' })
  @IsBoolean()
  sendAutoReply!: boolean;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resumeService: ResumeService,
    private readonly imapProvider: ImapProvider,
    private readonly smtpProvider: SmtpProvider,
    private readonly configService: ConfigService,
  ) {}

  @Cron('*/15 * * * *')
  async syncEmails() {
    this.logger.log('Iniciando sincronização automática de e-mails...');
    try {
      const result = await this.syncNow();
      this.logger.log(`Sincronização automática concluída: ${result.processed} e-mail(s)`);
    } catch (err) {
      this.logger.error('Erro na sincronização automática', err instanceof Error ? err.message : err);
    }
  }

  private friendlyImapError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    if (/Application-specific password required/i.test(msg))
      return 'O Gmail exige uma Senha de App para IMAP. Acesse Minha Conta Google → Segurança → Senhas de app, gere uma senha para "TalentFit" e use-a no campo Senha.';
    if (/ECONNREFUSED/i.test(msg)) return 'Conexão recusada — verifique o host e a porta';
    if (/ETIMEDOUT|ECONNRESET/i.test(msg)) return 'Tempo limite de conexão — verifique o host e a porta';
    if (/ENOTFOUND/i.test(msg)) return 'Host não encontrado — verifique o endereço do servidor';
    if (/auth|LOGIN|credential|password|user/i.test(msg)) return 'Falha de autenticação — verifique o usuário e a senha';
    if (/certificate|TLS|SSL/i.test(msg)) return 'Erro de certificado SSL — tente porta 143 sem TLS';
    return msg;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private buildPreRegistrationEmailHtml(candidateName: string, link: string, logoUrl: string): string {
    const firstName = this.escapeHtml(candidateName?.trim().split(/\s+/)[0] || '');

    return `
      <div style="background:#f4f5f7;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:#022061;padding:20px 32px;">
              <img src="${logoUrl}" width="150" alt="GEHFER" style="display:block;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#022061;">Recebemos seu currículo!</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333333;">
                Olá${firstName ? `, ${firstName}` : ''}! Seu currículo já está em análise pela nossa equipe de Recursos Humanos.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#333333;">
                Para continuar seu processo seletivo, precisamos que você complete as próximas etapas pelo link abaixo:
              </p>
              <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.7;color:#333333;">
                <li>Confirme seus dados pessoais;</li>
                <li>Revise e complete seu currículo digital (experiência, formação, idiomas e habilidades) — já vamos adiantar algumas informações a partir do currículo enviado;</li>
                <li>Responda o questionário de perfil comportamental — leva cerca de 15 minutos, sem interrupções.</li>
              </ul>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#022061;border-radius:6px;">
                    <a href="${link}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">
                      Completar cadastro
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#667085;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br/>
                <a href="${link}" style="color:#022061;word-break:break-all;">${link}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f4f5f7;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">Atenciosamente,<br/>Equipe de Recursos Humanos — GEHFER</p>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  private async sendPreRegistrationReply(
    config: { smtpHost: string | null; smtpPort: number | null; user: string; password: string },
    to: string,
    candidateId: string,
    candidateName: string,
  ) {
    if (!config.smtpHost || !config.smtpPort) {
      this.logger.warn('sendAutoReply está ativo, mas o SMTP não está configurado — resposta não enviada');
      return;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'https://new-system-talentfit.vercel.app';
    const link = `${frontendUrl}/pre-cadastro?candidateId=${candidateId}`;
    const logoUrl = `${frontendUrl}/logo_principal_png.png`;

    try {
      await this.smtpProvider.sendMail(
        { host: config.smtpHost, port: config.smtpPort, user: config.user, password: config.password },
        {
          to,
          subject: 'Recebemos seu currículo — GEHFER',
          html: this.buildPreRegistrationEmailHtml(candidateName, link, logoUrl),
        },
      );
    } catch (err) {
      this.logger.error(`Erro ao enviar resposta automática para ${to}`, err instanceof Error ? err.message : err);
    }
  }

  async syncNow() {
    let config;
    try {
      config = await this.prisma.emailConfig.findFirst({ where: { active: true } });
    } catch (err) {
      this.logger.error('Erro ao buscar configuração de e-mail', err);
      throw new InternalServerErrorException('Erro ao acessar banco de dados: ' + (err instanceof Error ? err.message : err));
    }

    if (!config) throw new NotFoundException('Nenhuma configuração de e-mail ativa. Salve as configurações primeiro.');

    const uploadDir = this.resumeService.getUploadDir();
    let messages;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subjectFilter: string | undefined = (config as any).subjectFilter ?? undefined;
      messages = await this.imapProvider.fetchUnread(
        { host: config.host, port: config.port, user: config.user, password: config.password },
        uploadDir,
        subjectFilter,
      );
    } catch (err) {
      this.logger.error('Erro de conexão IMAP durante sincronização', err);
      throw new InternalServerErrorException(this.friendlyImapError(err));
    }

    for (const msg of messages) {
      const emailRecord = await this.prisma.emailRecord.create({
        data: { sender: msg.sender, subject: msg.subject, receivedAt: msg.receivedAt },
      });

      let candidateId: string | undefined;
      let candidateName: string | undefined;

      for (const attachment of msg.attachments) {
        try {
          const resume = await this.resumeService.uploadAndProcess(
            {
              fieldname: 'file',
              originalname: attachment.originalName,
              encoding: '7bit',
              mimetype: attachment.mimeType,
              path: attachment.filePath,
              filename: attachment.filename,
              size: 0,
              stream: null as never,
              destination: uploadDir,
              buffer: null as never,
            },
            emailRecord.id,
          );
          candidateId ??= resume.candidateId;
          candidateName ??= resume.candidate.name;
        } catch (err) {
          this.logger.error(`Erro ao processar anexo ${attachment.filename}`, err);
        }
      }

      await this.prisma.emailRecord.update({
        where: { id: emailRecord.id },
        data: { processed: true },
      });

      if (candidateId && msg.senderEmail && config.sendAutoReply) {
        await this.sendPreRegistrationReply(config, msg.senderEmail, candidateId, candidateName ?? '');
      }
    }

    this.logger.log(`Sincronização concluída: ${messages.length} e-mail(s) processados`);
    return { synced: true, processed: messages.length };
  }

  async testConnection() {
    let config;
    try {
      config = await this.prisma.emailConfig.findFirst({ where: { active: true } });
    } catch (err) {
      this.logger.error('Erro ao buscar configuração de e-mail', err);
      throw new InternalServerErrorException('Erro ao acessar banco de dados: ' + (err instanceof Error ? err.message : err));
    }

    if (!config) throw new NotFoundException('Nenhuma configuração de e-mail ativa. Salve as configurações primeiro.');

    try {
      const ok = await this.imapProvider.testConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
      });
      return { connected: ok, error: ok ? null : 'Falha na autenticação — verifique usuário e senha' };
    } catch (err) {
      this.logger.error('Erro inesperado ao testar conexão IMAP', err);
      return { connected: false, error: this.friendlyImapError(err) };
    }
  }

  async testSmtpConnection() {
    const config = await this.prisma.emailConfig.findFirst({ where: { active: true } });
    if (!config) throw new NotFoundException('Nenhuma configuração de e-mail ativa. Salve as configurações primeiro.');
    if (!config.smtpHost || !config.smtpPort) {
      return { connected: false, error: 'Configure o host e a porta SMTP primeiro' };
    }

    const ok = await this.smtpProvider.testConnection({
      host: config.smtpHost,
      port: config.smtpPort,
      user: config.user,
      password: config.password,
    });
    return { connected: ok, error: ok ? null : 'Falha na conexão SMTP — verifique host, porta, usuário e senha' };
  }

  async getConfig() {
    const config = await this.prisma.emailConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (!config) return null;
    const { password, ...rest } = config;
    return { ...rest, hasPassword: !!password };
  }

  async upsertConfig(dto: UpsertEmailConfigDto) {
    try {
      const existing = await this.prisma.emailConfig.findFirst();

      if (!existing && !dto.password) {
        throw new BadRequestException('Informe a senha para configurar o e-mail.');
      }

      // Senha vazia = manter a senha atual (a tela nunca recebe a senha real de volta do backend).
      const { password, ...rest } = dto;
      const data = password ? { ...rest, password } : rest;

      if (existing) {
        return await this.prisma.emailConfig.update({
          where: { id: existing.id },
          data,
        });
      }
      return await this.prisma.emailConfig.create({ data: data as Parameters<typeof this.prisma.emailConfig.create>[0]['data'] });
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error('Erro ao salvar configuração de e-mail', err);
      throw new InternalServerErrorException('Erro ao salvar: ' + (err instanceof Error ? err.message : err));
    }
  }
}
