import { Module } from '@nestjs/common';
import { DigitalResumeService } from './digital-resume.service';
import { DigitalResumeController } from './digital-resume.controller';

@Module({
  controllers: [DigitalResumeController],
  providers: [DigitalResumeService],
})
export class DigitalResumeModule {}
