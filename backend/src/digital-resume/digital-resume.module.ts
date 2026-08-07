import { Module } from '@nestjs/common';
import { DigitalResumeService } from './digital-resume.service';
import { DigitalResumeController } from './digital-resume.controller';
import { ClassificationModule } from '../classification/classification.module';

@Module({
  imports: [ClassificationModule],

@Module({
  controllers: [DigitalResumeController],
  providers: [DigitalResumeService],
})
export class DigitalResumeModule {}
