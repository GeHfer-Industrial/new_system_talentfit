import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@ApiTags('Candidates')
@ApiBearerAuth()
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista candidatos' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) {
    return this.candidatesService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca candidato por ID' })
  findOne(@Param('id') id: string) {
    return this.candidatesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza dados do candidato' })
  update(@Param('id') id: string, @Body() dto: UpdateCandidateDto) {
    return this.candidatesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove candidato' })
  remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}
