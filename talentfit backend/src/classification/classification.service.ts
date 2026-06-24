import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CLASSIFICATION_ENGINE,
  ClassificationResult,
  IClassificationEngine,
} from './engine/keyword.engine';

@Injectable()
export class ClassificationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLASSIFICATION_ENGINE)
    private readonly engine: IClassificationEngine,
  ) {}

  async classify(resumeText: string): Promise<ClassificationResult> {
    const [jobs, config] = await Promise.all([
      this.prisma.job.findMany({
        where: { status: 'OPEN' },
        include: { keywords: true },
      }),
      this.prisma.classificationConfig.findFirst(),
    ]);

    const classificationConfig = config ?? {
      pointsRequired: 20,
      pointsDesired: 10,
      minScoreToMatch: 40,
    };

    return await this.engine.classify(resumeText, jobs, classificationConfig);
  }
}
