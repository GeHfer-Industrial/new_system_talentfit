import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TalentPoolService } from './talent-pool.service';

class AssociateJobDto {
  @ApiProperty()
  @IsString()
  jobId!: string;
}

@ApiTags('TalentPool')
@ApiBearerAuth()
@Controller('talent-pool')
export class TalentPoolController {
  constructor(private readonly talentPoolService: TalentPoolService) {}

  @Get()
  @ApiOperation({ summary: 'Lista banco de talentos' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'jobId', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('jobId') jobId?: string,
  ) {
    return this.talentPoolService.findAll(search, jobId);
  }

  @Post('re-evaluate')
  @ApiOperation({ summary: 'Reclassifica todos os candidatos do banco de talentos com IA' })
  reEvaluate() {
    return this.talentPoolService.reEvaluate();
  }

  @Post('re-evaluate/:candidateId')
  @ApiOperation({ summary: 'Reclassifica um candidato específico com IA' })
  reEvaluateOne(@Param('candidateId') candidateId: string) {
    return this.talentPoolService.reEvaluateOne(candidateId);
  }

  @Patch(':candidateId')
  @ApiOperation({ summary: 'Associa candidato a uma vaga' })
  associate(
    @Param('candidateId') candidateId: string,
    @Body() dto: AssociateJobDto,
  ) {
    return this.talentPoolService.associateToJob(candidateId, dto.jobId);
  }

  @Delete(':candidateId')
  @ApiOperation({ summary: 'Remove candidato do banco de talentos' })
  remove(@Param('candidateId') candidateId: string) {
    return this.talentPoolService.remove(candidateId);
  }
}
