import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { Classification } from '@prisma/client';
import {
  ClassificationConfig,
  ClassificationResult,
  IClassificationEngine,
  JobWithKeywords,
} from './keyword.engine';

const fallback = (): ClassificationResult => ({
  jobId: null,
  score: 0,
  classification: Classification.TALENT_POOL,
  matchedKeywords: [],
  candidateSkills: [],
  aiSummary: null,
  engine: 'groq',
});

@Injectable()
export class GroqClassificationEngine implements IClassificationEngine {
  private readonly client: Groq;
  private readonly logger = new Logger(GroqClassificationEngine.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
    });
  }

  async classify(
    resumeText: string,
    jobs: JobWithKeywords[],
    config: ClassificationConfig,
  ): Promise<ClassificationResult> {
    const openJobs = jobs.filter((j) => j.status === 'OPEN');

    const jobsDescription = openJobs.length
      ? openJobs
          .map((j) => {
            const required = j.keywords.filter((k) => k.type === 'REQUIRED').map((k) => k.keyword).join(', ');
            const desired = j.keywords.filter((k) => k.type === 'DESIRED').map((k) => k.keyword).join(', ');
            return `Job ID: "${j.id}"\n  Obrigatórias: ${required || 'nenhuma'}\n  Desejadas: ${desired || 'nenhuma'}`;
          })
          .join('\n\n')
      : 'Nenhuma vaga aberta no momento.';

    const prompt = `Você é um sistema especializado em triagem de currículos para RH. Analise o currículo abaixo.

VAGAS DISPONÍVEIS:
${jobsDescription}

TEXTO DO CURRÍCULO:
${resumeText.slice(0, 6000)}

INSTRUÇÕES:
1. Extraia as competências/habilidades do candidato (independente das vagas)
2. Identifique a melhor vaga correspondente, considerando sinônimos (ex: "React" = "ReactJS")
3. Para a melhor vaga, liste as keywords que o candidato possui
4. Calcule o score: keyword obrigatória = ${config.pointsRequired} pts, desejada = ${config.pointsDesired} pts
5. Classifique:
   - COMPATIBLE: score >= ${config.minScoreToMatch}
   - PARTIAL: 0 < score < ${config.minScoreToMatch}
   - TALENT_POOL: score = 0 ou sem vagas
6. Escreva um aiSummary em português (máx. 2 frases):
   - Se COMPATIBLE/PARTIAL: por que o candidato é compatível
   - Se TALENT_POOL: quais habilidades ele tem, o que falta e quais tipos de vaga poderia preencher futuramente

Responda APENAS com JSON válido, sem markdown, sem explicações:
{
  "jobId": "id-da-vaga ou null",
  "score": 0,
  "classification": "COMPATIBLE | PARTIAL | TALENT_POOL",
  "matchedKeywords": ["keyword1"],
  "candidateSkills": ["skill1", "skill2", "skill3"],
  "aiSummary": "Resumo em português de até 2 frases."
}`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.1,
      });

      const text = completion.choices[0]?.message?.content ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in Groq response');

      const parsed = JSON.parse(jsonMatch[0]);

      const classification: Classification =
        parsed.classification === 'COMPATIBLE'
          ? Classification.COMPATIBLE
          : parsed.classification === 'PARTIAL'
            ? Classification.PARTIAL
            : Classification.TALENT_POOL;

      this.logger.log(`Classificado: ${classification} | score: ${parsed.score} | skills: ${parsed.candidateSkills?.join(', ')}`);

      return {
        jobId: classification === Classification.TALENT_POOL ? null : (parsed.jobId ?? null),
        score: Number(parsed.score) || 0,
        classification,
        matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : [],
        candidateSkills: Array.isArray(parsed.candidateSkills) ? parsed.candidateSkills : [],
        aiSummary: typeof parsed.aiSummary === 'string' ? parsed.aiSummary : null,
        engine: 'groq',
      };
    } catch (err: any) {
      this.logger.error(`Groq classification failed: ${err?.message ?? err}`);
      return fallback();
    }
  }
}
