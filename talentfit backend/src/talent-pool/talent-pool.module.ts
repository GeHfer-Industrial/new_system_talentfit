import { Module } from '@nestjs/common';
import { TalentPoolService } from './talent-pool.service';
import { TalentPoolController } from './talent-pool.controller';
import { ClassificationModule } from '../classification/classification.module';

@Module({
  imports: [ClassificationModule],
  controllers: [TalentPoolController],
  providers: [TalentPoolService],
})
export class TalentPoolModule {}
