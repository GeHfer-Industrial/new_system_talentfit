import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobStatus } from '@prisma/client';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria nova vaga' })
  create(@Body() dto: CreateJobDto) {
    return this.jobsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista vagas' })
  @ApiQuery({ name: 'status', enum: JobStatus, required: false })
  @ApiQuery({ name: 'department', required: false })
  findAll(
    @Query('status') status?: JobStatus,
    @Query('department') department?: string,
  ) {
    return this.jobsService.findAll({ status, department });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca vaga por ID' })
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza vaga' })
  update(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.jobsService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Alterna status da vaga (OPEN/CLOSED)' })
  toggleStatus(@Param('id') id: string) {
    return this.jobsService.toggleStatus(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove vaga' })
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}
