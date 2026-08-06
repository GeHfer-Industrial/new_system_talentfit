import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { BehavioralProfileService } from './behavioral-profile.service';
import { SubmitBehavioralResultDto } from './dto/submit-behavioral-result.dto';

@ApiTags('Behavioral Profile')
@Controller('behavioral-profile')
export class BehavioralProfileController {
  constructor(private readonly behavioralProfileService: BehavioralProfileService) {}

  @Get('questions')
  @Public()
  @ApiOperation({ summary: 'Lista as 25 perguntas do teste de perfil comportamental' })
  getQuestions() {
    return this.behavioralProfileService.getQuestions();
  }

  @Get('content')
  @Public()
  @ApiOperation({ summary: 'Retorna os textos descritivos dos perfis e quadrantes' })
  getContent() {
    return this.behavioralProfileService.getContent();
  }

  @Post('results')
  @Public()
  @ApiOperation({ summary: 'Recebe as respostas do candidato e calcula o resultado' })
  submitResult(@Body() dto: SubmitBehavioralResultDto) {
    return this.behavioralProfileService.submitResult(dto);
  }
}
