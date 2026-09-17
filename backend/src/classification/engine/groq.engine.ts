import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
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

const MAX_COMPLETION_TOKENS = 3000;

function isRateLimitError(err: any): boolean {
  return (
    err?.status === 429 ||
    err?.error?.code === 'rate_limit_exceeded' ||
    /rate_limit_exceeded/i.test(err?.message ?? '')
  );
}

// A Groq informa o tempo de espera exato na própria mensagem de erro
// (ex: "Please try again in 15m9.36s."). Usamos esse valor real em vez de
// estimar, já que o limite pode ser por minuto (TPM) ou por dia (TPD) —
// os tempos de espera são completamente diferentes entre os dois.
function parseRetryAfterMs(message: string): number | undefined {
  const match = message.match(/try again in (?:(\d+)m)?([\d.]+)s/i);
  if (!match) return undefined;
  const minutes = match[1] ? parseInt(match[1], 10) : 0;
  const seconds = parseFloat(match[2]);
  return Math.ceil((minutes * 60 + seconds) * 1000);
}

@Injectable()
export class GroqClassificationEngine implements IClassificationEngine {
  private readonly client: Groq;
  private readonly logger = new Logger(GroqClassificationEngine.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
      maxRetries: 0,
      timeout: 20000,
    });
  }

  async classify(
    resumeText: string,
    jobs: JobWithKeywords[],
    config: ClassificationConfig,
  ): Promise<ClassificationResult> {
    const prompt = buildClassificationPrompt(resumeText, jobs, config);

    try {
      const completion = await this.client.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: MAX_COMPLETION_TOKENS,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const text = completion.choices[0]?.message?.content ?? '';
      const result = parseClassificationResponse(text, 'groq');

      this.logger.log(`Classificado: ${result.classification} | score: ${result.score} | skills: ${result.candidateSkills.join(', ')}`);

      return {
        ...result,
        // A Groq reserva "prompt_tokens + max_tokens" contra o limite por minuto (TPM)
        // no momento da chamada, não o total realmente usado — por isso pausamos com
        // base nesse valor reservado, não em completion.usage.total_tokens.
        tokensUsed: (completion.usage?.prompt_tokens ?? 0) + MAX_COMPLETION_TOKENS,
      };
    } catch (err: any) {
      if (isRateLimitError(err)) {
        const retryAfterMs = parseRetryAfterMs(err?.message ?? '');
        this.logger.error(`Groq rate limit atingido (retry em ${retryAfterMs ?? '?'}ms): ${err?.message ?? err}`);
        throw new ClassificationRateLimitError(
          'Limite de uso da IA (Groq) atingido. Tente novamente em alguns instantes.',
          retryAfterMs,
        );
      }
      this.logger.error(`Groq classification failed: ${err?.message ?? err}`);
      return classificationFallback('groq');
    }
  }
}
