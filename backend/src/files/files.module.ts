import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { ResumeModule } from '../resume/resume.module';

@Module({
  imports: [ResumeModule],
  controllers: [FilesController],
})
export class FilesModule {}
