import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClassificationService } from './classification.service';
import {
  CLASSIFICATION_ENGINE,
  KeywordClassificationEngine,
} from './engine/keyword.engine';
import { GroqClassificationEngine } from './engine/groq.engine';
import { GeminiClassificationEngine } from './engine/gemini.engine';

@Module({
  imports: [ConfigModule],
  providers: [
    ClassificationService,
    KeywordClassificationEngine,
    GroqClassificationEngine,
    GeminiClassificationEngine,
    {
      provide: CLASSIFICATION_ENGINE,
      inject: [ConfigService, KeywordClassificationEngine, GroqClassificationEngine, GeminiClassificationEngine],
      useFactory: (
        configService: ConfigService,
        keywordEngine: KeywordClassificationEngine,
        groqEngine: GroqClassificationEngine,
        geminiEngine: GeminiClassificationEngine,
      ) => {
        const type = configService.get<string>('CLASSIFICATION_ENGINE') ?? 'gemini';
        if (type === 'keyword') return keywordEngine;
        if (type === 'groq') return groqEngine;
        return geminiEngine;
      },
    },
  ],
  exports: [ClassificationService],
})
export class ClassificationModule {}
