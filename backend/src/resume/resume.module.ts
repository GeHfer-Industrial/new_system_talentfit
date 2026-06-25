import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { ClassificationModule } from '../classification/classification.module';
import { PdfExtractor } from './extractors/pdf.extractor';
import { DocxExtractor } from './extractors/docx.extractor';

@Module({
  imports: [
    ClassificationModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uploadDir = configService.get<string>('UPLOAD_DIR') ?? (process.env.VERCEL ? '/tmp' : './uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        return {
          storage: diskStorage({
            destination: uploadDir,
            filename: (_req, file, cb) => {
              cb(null, `${randomUUID()}${extname(file.originalname)}`);
            },
          }),
          limits: { fileSize: 10 * 1024 * 1024 },
          fileFilter: (
            _req,
            file: Express.Multer.File,
            cb: (error: Error | null, acceptFile: boolean) => void,
          ) => {
            const allowed = [
              'application/pdf',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ];
            cb(null, allowed.includes(file.mimetype));
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [ResumeController],
  providers: [ResumeService, PdfExtractor, DocxExtractor],
  exports: [ResumeService],
})
export class ResumeModule {}
