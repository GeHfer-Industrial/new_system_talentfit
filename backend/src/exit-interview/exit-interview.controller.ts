import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { ExitInterviewService } from './exit-interview.service';
import { CreateExitInterviewDto } from './dto/create-exit-interview.dto';

@ApiTags('Exit Interviews')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.RECRUITER)
@Controller('exit-interviews')
export class ExitInterviewController {
  constructor(private readonly exitInterviewService: ExitInterviewService) {}

  @Get('meta')
  @ApiOperation({ summary: 'Retorna departamentos e opções de resposta do formulário' })
  getMeta() {
    return this.exitInterviewService.getMeta();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Retorna estatísticas agregadas das entrevistas, opcionalmente filtradas por departamento' })
  @ApiQuery({ name: 'department', required: false })
  getStats(@Query('department') department?: string) {
    return this.exitInterviewService.getStats(department);
  }

  @Post()
  @ApiOperation({ summary: 'Registra uma nova entrevista de desligamento' })
  create(@Body() dto: CreateExitInterviewDto) {
    return this.exitInterviewService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista entrevistas de desligamento' })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'departureType', required: false })
  findAll(
    @Query('department') department?: string,
    @Query('departureType') departureType?: string,
  ) {
    return this.exitInterviewService.findAll({ department, departureType });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca entrevista de desligamento por ID' })
  findOne(@Param('id') id: string) {
    return this.exitInterviewService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove entrevista de desligamento' })
  remove(@Param('id') id: string) {
    return this.exitInterviewService.remove(id);
  }
}
