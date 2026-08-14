import {
  Controller,
  Get,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { EmailService, UpsertEmailConfigDto } from './email.service';

class SendPreRegistrationEmailDto {
  @ApiProperty()
  @IsString()
  candidateId!: string;
}

@ApiTags('Email')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

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
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ApiOperation({ summary: 'Dispara sincronização manual de e-mails' })
  sync() {
    return this.emailService.syncNow();
  }

  @Post('send-pre-registration')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ApiOperation({ summary: 'Envia o e-mail de pré-cadastro diretamente para o candidato' })
  sendPreRegistration(@Body() dto: SendPreRegistrationEmailDto) {
    return this.emailService.sendPreRegistrationEmailToCandidate(dto.candidateId);
  }
}
