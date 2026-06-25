import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { ImapProvider } from './providers/imap.provider';
import { ResumeModule } from '../resume/resume.module';

@Module({
  imports: [ResumeModule],
  controllers: [EmailController],
  providers: [EmailService, ImapProvider],
})
export class EmailModule {}
