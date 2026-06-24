import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ResumeService } from '../resume/resume.service';
import { ImapProvider } from './providers/imap.provider';
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
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resumeService: ResumeService,
    private readonly imapProvider: ImapProvider,
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

      for (const attachment of msg.attachments) {
        try {
          await this.resumeService.uploadAndProcess(
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
        } catch (err) {
          this.logger.error(`Erro ao processar anexo ${attachment.filename}`, err);
        }
      }

      await this.prisma.emailRecord.update({
        where: { id: emailRecord.id },
        data: { processed: true },
      });
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

  async getConfig() {
    return this.prisma.emailConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
  }

  async upsertConfig(dto: UpsertEmailConfigDto) {
    try {
      const existing = await this.prisma.emailConfig.findFirst();
      if (existing) {
        return await this.prisma.emailConfig.update({
          where: { id: existing.id },
          data: { ...dto },
        });
      }
      return await this.prisma.emailConfig.create({ data: dto as Parameters<typeof this.prisma.emailConfig.create>[0]['data'] });
    } catch (err) {
      this.logger.error('Erro ao salvar configuração de e-mail', err);
      throw new InternalServerErrorException('Erro ao salvar: ' + (err instanceof Error ? err.message : err));
    }
  }
}
