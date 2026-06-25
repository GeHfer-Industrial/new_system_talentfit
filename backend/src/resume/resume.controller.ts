import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Classification } from '@prisma/client';
import { ResumeService } from './resume.service';

class UpdateClassificationDto {
  @ApiProperty({ enum: Classification })
  @IsEnum(Classification)
  classification!: Classification;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  jobId?: string;
}

@ApiTags('Resumes')
@ApiBearerAuth()
@Controller('resumes')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload e processa currículo PDF/DOCX' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
      const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      cb(null, allowed.includes(file.mimetype))
    },
  }))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.resumeService.uploadAndProcess(file);
  }

  @Get()
  @ApiOperation({ summary: 'Lista currículos' })
  @ApiQuery({ name: 'classification', enum: Classification, required: false })
  @ApiQuery({ name: 'jobId', required: false })
  findAll(
    @Query('classification') classification?: Classification,
    @Query('jobId') jobId?: string,
  ) {
    return this.resumeService.findAll({ classification, jobId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca currículo por ID' })
  findOne(@Param('id') id: string) {
    return this.resumeService.findOne(id);
  }

  @Put(':id/classification')
  @ApiOperation({ summary: 'Atualiza classificação do currículo' })
  updateClassification(
    @Param('id') id: string,
    @Body() dto: UpdateClassificationDto,
  ) {
    return this.resumeService.updateClassification(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove currículo e arquivo físico' })
  remove(@Param('id') id: string) {
    return this.resumeService.remove(id);
  }
}
