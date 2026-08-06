import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PreRegistrationService } from './pre-registration.service';
import { CreatePreRegistrationDto } from './dto/create-pre-registration.dto';

@ApiTags('Pre-Registration')
@Controller('pre-registration')
export class PreRegistrationController {
  constructor(private readonly preRegistrationService: PreRegistrationService) {}

  @Get('status/:candidateId')
  @Public()
  @ApiOperation({ summary: 'Verifica se o candidato já concluiu o pré-cadastro/questionário' })
  getStatus(@Param('candidateId') candidateId: string) {
    return this.preRegistrationService.getStatus(candidateId);
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Recebe o pré-cadastro público de um candidato' })
  create(@Body() dto: CreatePreRegistrationDto) {
    return this.preRegistrationService.create(dto);
  }
}
