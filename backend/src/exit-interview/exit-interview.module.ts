import { Module } from '@nestjs/common';
import { ExitInterviewService } from './exit-interview.service';
import { ExitInterviewController } from './exit-interview.controller';

@Module({
  controllers: [ExitInterviewController],
  providers: [ExitInterviewService],
})
export class ExitInterviewModule {}
