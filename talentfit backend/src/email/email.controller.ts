import {
  Controller,
  Get,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService, UpsertEmailConfigDto } from './email.service';

@ApiTags('Email')
@ApiBearerAuth()
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

  @Post('sync')
  @ApiOperation({ summary: 'Dispara sincronização manual de e-mails' })
  sync() {
    return this.emailService.syncNow();
  }
}
