import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { DigitalResumeService } from './digital-resume.service';
import { CreateDigitalResumeDto } from './dto/create-digital-resume.dto';

@ApiTags('Digital Resume')
@Controller('digital-resume')
export class DigitalResumeController {
  constructor(private readonly digitalResumeService: DigitalResumeService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Recebe o currículo digital preenchido pelo candidato' })
  create(@Body() dto: CreateDigitalResumeDto) {
    return this.digitalResumeService.create(dto);
  }
}
