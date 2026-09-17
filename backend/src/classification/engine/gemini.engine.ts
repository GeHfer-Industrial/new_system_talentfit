import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  ClassificationConfig,
  ClassificationResult,
  IClassificationEngine,
  JobWithKeywords,
} from './keyword.engine';
import {
  ClassificationRateLimitError,
  buildClassificationPrompt,
  classificationFallback,
  parseClassificationResponse,
} from './shared';

// flash-lite: recomendado pela própria Google para tarefas de alto volume que não
// exigem raciocínio profundo — nosso caso (extração/classificação estruturada).
// O gemini-3.8-flash (mais novo) apresentou instabilidade (503 "high demand") nos
// testes, então ficamos com o flash-lite, mais barato e estável.
const MODEL = 'gemini-3.1-flash-lite';

function isRateLimitError(err: any): boolean {
  return (
    err?.status === 429 ||
    err?.status === 'RESOURCE_EXHAUSTED' ||
    /RESOURCE_EXHAUSTED|rate.?limit|quota/i.test(err?.message ?? '')
  );
}

// O Gemini às vezes informa o tempo de espera em segundos dentro dos detalhes
// do erro (ex: "retryDelay":"20s" ou "Please retry in 20.5s"). Usamos esse
// valor real quando disponível, em vez de estimar.
function parseRetryAfterMs(message: string): number | undefined {
  const match = message.match(/retry(?:Delay)?["\s:]*(\d+(?:\.\d+)?)s/i);
  if (!match) return undefined;
  return Math.ceil(parseFloat(match[1]) * 1000);
}

@Injectable()
export class GeminiClassificationEngine implements IClassificationEngine {
  private readonly client: GoogleGenAI;
  private readonly logger = new Logger(GeminiClassificationEngine.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.get<string>('GEMINI_API_KEY'),
    });
  }

  async classify(
    resumeText: string,
    jobs: JobWithKeywords[],
    config: ClassificationConfig,
  ): Promise<ClassificationResult> {
    const prompt = buildClassificationPrompt(resumeText, jobs, config);

    try {
      const response = await this.client.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          // Tarefa é extração/classificação estruturada direta, não precisa de
          // raciocínio em etapas — desativar "thinking" corta bastante tokens/custo.
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      const text = response.text ?? '';
      const result = parseClassificationResponse(text, 'gemini');

      this.logger.log(`Classificado: ${result.classification} | score: ${result.score} | skills: ${result.candidateSkills.join(', ')}`);

      return {
        ...result,
        tokensUsed: response.usageMetadata?.totalTokenCount,
      };
    } catch (err: any) {
      if (isRateLimitError(err)) {
        const retryAfterMs = parseRetryAfterMs(err?.message ?? '');
        this.logger.error(`Gemini rate limit atingido (retry em ${retryAfterMs ?? '?'}ms): ${err?.message ?? err}`);
        throw new ClassificationRateLimitError(
          'Limite de uso da IA (Gemini) atingido. Tente novamente em alguns instantes.',
          retryAfterMs,
        );
      }
      this.logger.error(`Gemini classification failed: ${err?.message ?? err}`);
      return classificationFallback('gemini');
    }
  }
}
