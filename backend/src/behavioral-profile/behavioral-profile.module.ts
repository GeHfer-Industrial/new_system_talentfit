import { Module } from '@nestjs/common';
import { BehavioralProfileService } from './behavioral-profile.service';
import { BehavioralProfileController } from './behavioral-profile.controller';

@Module({
  controllers: [BehavioralProfileController],
  providers: [BehavioralProfileService],
})
export class BehavioralProfileModule {}
