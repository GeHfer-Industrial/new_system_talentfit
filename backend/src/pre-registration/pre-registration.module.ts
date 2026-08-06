import { Module } from '@nestjs/common';
import { PreRegistrationService } from './pre-registration.service';
import { PreRegistrationController } from './pre-registration.controller';

@Module({
  controllers: [PreRegistrationController],
  providers: [PreRegistrationService],
})
export class PreRegistrationModule {}
