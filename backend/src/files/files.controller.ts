import { Controller, Get, Header, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { ResumeStorageService } from '../resume/resume-storage.service';

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly resumeStorageService: ResumeStorageService) {}

  @Get(':filename')
  @Public()
  @ApiOperation({ summary: 'Baixa o arquivo original do currículo' })
  @Header('Cache-Control', 'no-store')
  async download(@Param('filename') filename: string, @Res() res: Response) {
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    const contentType = CONTENT_TYPES[ext];
    if (!contentType) throw new NotFoundException('Arquivo não encontrado');

    let buffer: Buffer;
    try {
      buffer = await this.resumeStorageService.download(filename);
    } catch {
      throw new NotFoundException('Arquivo não encontrado');
    }

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
