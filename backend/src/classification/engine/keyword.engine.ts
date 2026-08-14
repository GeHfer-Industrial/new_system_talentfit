import { Injectable } from '@nestjs/common';
import { Classification, KeywordType } from '@prisma/client';

export interface JobWithKeywords {
  id: string;
  status: string;
  keywords: Array<{ keyword: string; type: KeywordType }>;
}

export interface CandidateExperience {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface CandidateEducation {
  institution: string;
  course: string;
  level: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

export interface CandidateLanguage {
  language: string;
  level: string;
}

export interface ClassificationResult {
  jobId: string | null;
  score: number;
  classification: Classification;
  matchedKeywords: string[];
  candidateName: string | null;
  candidateSkills: string[];
  candidateExperiences: CandidateExperience[];
  candidateEducations: CandidateEducation[];
  candidateLanguages: CandidateLanguage[];
  aiSummary: string | null;
  engine: string;
}

export interface IClassificationEngine {
  classify(resumeText: string, jobs: JobWithKeywords[], config: ClassificationConfig): Promise<ClassificationResult> | ClassificationResult;
}

export interface ClassificationConfig {
  pointsRequired: number;
  pointsDesired: number;
  minScoreToMatch: number;
}

export const CLASSIFICATION_ENGINE = 'CLASSIFICATION_ENGINE';

@Injectable()
export class KeywordClassificationEngine implements IClassificationEngine {
  classify(
    resumeText: string,
    jobs: JobWithKeywords[],
    config: ClassificationConfig,
  ): ClassificationResult {
    const text = resumeText.toLowerCase();
    let bestJobId: string | null = null;
    let bestScore = 0;
    let bestMatches: string[] = [];

    for (const job of jobs) {
      if (job.status !== 'OPEN') continue;

      let score = 0;
      const matches: string[] = [];

      for (const { keyword, type } of job.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          matches.push(keyword);
          score +=
            type === KeywordType.REQUIRED
              ? config.pointsRequired
              : config.pointsDesired;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestJobId = job.id;
        bestMatches = matches;
      }
    }

    const classification =
      bestScore >= config.minScoreToMatch
        ? Classification.COMPATIBLE
        : bestScore > 0
          ? Classification.PARTIAL
          : Classification.TALENT_POOL;

    return {
      jobId: classification === Classification.TALENT_POOL ? null : bestJobId,
      score: bestScore,
      classification,
      matchedKeywords: bestMatches,
      candidateName: null,
      candidateSkills: bestMatches,
      candidateExperiences: [],
      candidateEducations: [],
      candidateLanguages: [],
      aiSummary: null,
      engine: 'keyword',
    };
  }
}
