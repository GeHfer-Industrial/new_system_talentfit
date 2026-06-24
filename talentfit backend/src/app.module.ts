import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { CandidatesModule } from './candidates/candidates.module';
import { ResumeModule } from './resume/resume.module';
import { ClassificationModule } from './classification/classification.module';
import { EmailModule } from './email/email.module';
import { TalentPoolModule } from './talent-pool/talent-pool.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  providers: [
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
  ],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          rootPath: join(process.cwd(), configService.get<string>('UPLOAD_DIR') ?? 'uploads'),
          serveRoot: '/files',
        },
      ],
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    JobsModule,
    CandidatesModule,
    ResumeModule,
    ClassificationModule,
    EmailModule,
    TalentPoolModule,
    DashboardModule,
  ],
})
export class AppModule {}
