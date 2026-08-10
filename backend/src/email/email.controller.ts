import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { EmailService, UpsertEmailConfigDto } from './email.service';

@ApiTags('Email')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'Retorna configuração de e-mail' })
  getConfig() {
    return this.emailService.getConfig();
  }

  @Post('config')
  @ApiOperation({ summary: 'Salva configuração de e-mail' })
  upsertConfig(@Body() dto: UpsertEmailConfigDto) {
    return this.emailService.upsertConfig(dto);
  }

  @Get('test')
  @ApiOperation({ summary: 'Testa conexão IMAP' })
  testConnection() {
    return this.emailService.testConnection();
  }

  @Get('test-smtp')
  @ApiOperation({ summary: 'Testa conexão SMTP (envio da resposta automática)' })
  testSmtpConnection() {
    return this.emailService.testSmtpConnection();
  }

  @Post('sync')
  @ApiOperation({ summary: 'Dispara sincronização manual de e-mails' })
  sync() {
    return this.emailService.syncNow();
  }

  @Get('cron-sync')
  @Public()
  @ApiOperation({
    summary: 'Dispara a sincronização de e-mails — feito para ser chamado por um agendador externo (a Vercel não mantém processos em segundo plano)',
  })
  cronSync(@Headers('authorization') authorization?: string) {
    const secret = this.configService.get<string>('CRON_SECRET');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    if (!secret || token !== secret) {
      throw new UnauthorizedException('Token de agendador inválido');
    }
    return this.emailService.syncNow();
  }
}
