import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { ResumeStorageService } from './resume-storage.service';
import { ClassificationModule } from '../classification/classification.module';
import { PdfExtractor } from './extractors/pdf.extractor';
import { DocxExtractor } from './extractors/docx.extractor';

@Module({
  imports: [
    ClassificationModule,
    MulterModule.register({
      storage: memoryStorage(),
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
    }),
  ],
  controllers: [ResumeController],
  providers: [ResumeService, ResumeStorageService, PdfExtractor, DocxExtractor],
  exports: [ResumeService, ResumeStorageService],
})
export class ResumeModule {}
