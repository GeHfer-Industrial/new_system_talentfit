import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClassificationService } from './classification.service';
import {
  CLASSIFICATION_ENGINE,
  KeywordClassificationEngine,
} from './engine/keyword.engine';
import { GroqClassificationEngine } from './engine/groq.engine';

@Module({
  imports: [ConfigModule],
  providers: [
    ClassificationService,
    KeywordClassificationEngine,
    GroqClassificationEngine,
    {
      provide: CLASSIFICATION_ENGINE,
      inject: [ConfigService, KeywordClassificationEngine, GroqClassificationEngine],
      useFactory: (
        configService: ConfigService,
        keywordEngine: KeywordClassificationEngine,
        groqEngine: GroqClassificationEngine,
      ) => {
        const type = configService.get<string>('CLASSIFICATION_ENGINE') ?? 'groq';
        return type === 'keyword' ? keywordEngine : groqEngine;
      },
    },
  ],
  exports: [ClassificationService],
})
export class ClassificationModule {}
