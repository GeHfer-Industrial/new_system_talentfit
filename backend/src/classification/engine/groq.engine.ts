import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { Classification } from '@prisma/client';
import {
  CandidateEducation,
  CandidateExperience,
  CandidateLanguage,
  ClassificationConfig,
  ClassificationResult,
  IClassificationEngine,
  JobWithKeywords,
} from './keyword.engine';

const EDUCATION_LEVELS = ['ENSINO_MEDIO', 'TECNICO', 'SUPERIOR', 'POS_GRADUACAO', 'MESTRADO', 'DOUTORADO'];
const EDUCATION_STATUSES = ['EM_ANDAMENTO', 'CONCLUIDO', 'TRANCADO'];
const LANGUAGE_LEVELS = ['BASICO', 'INTERMEDIARIO', 'AVANCADO', 'FLUENTE'];

const fallback = (): ClassificationResult => ({
  jobId: null,
  score: 0,
  classification: Classification.TALENT_POOL,
  matchedKeywords: [],
  candidateName: null,
  candidateSkills: [],
  candidateExperiences: [],
  candidateEducations: [],
  candidateLanguages: [],
  aiSummary: null,
  engine: 'groq',
});

function sanitizeMonth(value: unknown): string | undefined {
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value) ? value : undefined;
}

function sanitizeExperiences(value: unknown): CandidateExperience[] {
  if (!Array.isArray(value)) return [];
  return (value as any[])
    .filter((item) => item && typeof item === 'object' && typeof item.company === 'string' && typeof item.role === 'string')
    .map((item) => ({
      company: item.company,
      role: item.role,
      startDate: sanitizeMonth(item.startDate) ?? '',
      endDate: sanitizeMonth(item.endDate),
      current: !!item.current,
      description: typeof item.description === 'string' ? item.description : undefined,
    }));
}

function sanitizeEducations(value: unknown): CandidateEducation[] {
  if (!Array.isArray(value)) return [];
  return (value as any[])
    .filter((item) => item && typeof item === 'object' && typeof item.institution === 'string' && typeof item.course === 'string')
    .map((item) => ({
      institution: item.institution,
      course: item.course,
      level: EDUCATION_LEVELS.includes(item.level) ? item.level : 'SUPERIOR',
      status: EDUCATION_STATUSES.includes(item.status) ? item.status : 'CONCLUIDO',
      startDate: sanitizeMonth(item.startDate),
      endDate: sanitizeMonth(item.endDate),
    }));
}

function sanitizeLanguages(value: unknown): CandidateLanguage[] {
  if (!Array.isArray(value)) return [];
  return (value as any[])
    .filter((item) => item && typeof item === 'object' && typeof item.language === 'string' && item.language.trim())
    .map((item) => ({
      language: item.language,
      level: LANGUAGE_LEVELS.includes(item.level) ? item.level : 'INTERMEDIARIO',
    }));
}

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
1. Identifique o nome completo do candidato (normalmente no topo do currículo, junto aos dados de contato). Se não conseguir identificar com segurança, retorne null.
2. Extraia as competências/habilidades do candidato (independente das vagas)
3. Identifique a melhor vaga correspondente, considerando sinônimos (ex: "React" = "ReactJS")
4. Para a melhor vaga, liste as keywords que o candidato possui
5. Calcule o score: keyword obrigatória = ${config.pointsRequired} pts, desejada = ${config.pointsDesired} pts
6. Classifique:
   - COMPATIBLE: score >= ${config.minScoreToMatch}
   - PARTIAL: 0 < score < ${config.minScoreToMatch}
   - TALENT_POOL: score = 0 ou sem vagas
7. Escreva um aiSummary em português (máx. 2 frases):
   - Se COMPATIBLE/PARTIAL: por que o candidato é compatível
   - Se TALENT_POOL: quais habilidades ele tem, o que falta e quais tipos de vaga poderia preencher futuramente
8. Extraia também, se estiverem presentes no texto, as experiências profissionais, formação acadêmica e idiomas do candidato:
   - Datas sempre no formato "AAAA-MM" (ano-mês). Se não souber o mês/ano exato, omita o campo.
   - "level" de formação deve ser um destes valores exatos: ${EDUCATION_LEVELS.join(', ')}
   - "status" de formação deve ser um destes valores exatos: ${EDUCATION_STATUSES.join(', ')}
   - "level" de idioma deve ser um destes valores exatos: ${LANGUAGE_LEVELS.join(', ')}
   - Se não houver informação suficiente para alguma seção, retorne um array vazio para ela — não invente dados.
   - IMPORTANTE: o campo "description" de cada experiência deve conter o texto COMPLETO das atividades/responsabilidades, exatamente como está escrito no currículo — inclua TODOS os tópicos/bullets daquela experiência, um por linha (separados por "\\n"). NÃO resuma, corte ou reescreva esse texto. Esse campo é diferente do "aiSummary": aqui é o conteúdo literal do currículo, o resumo de triagem fica só no "aiSummary".

Responda APENAS com JSON válido, sem markdown, sem explicações:
{
  "jobId": "id-da-vaga ou null",
  "score": 0,
  "classification": "COMPATIBLE | PARTIAL | TALENT_POOL",
  "matchedKeywords": ["keyword1"],
  "candidateName": "Nome Completo do Candidato ou null",
  "candidateSkills": ["skill1", "skill2", "skill3"],
  "candidateExperiences": [{"company": "", "role": "", "startDate": "AAAA-MM", "endDate": "AAAA-MM ou omitir", "current": false, "description": ""}],
  "candidateEducations": [{"institution": "", "course": "", "level": "SUPERIOR", "status": "CONCLUIDO", "startDate": "AAAA-MM", "endDate": "AAAA-MM"}],
  "candidateLanguages": [{"language": "", "level": "INTERMEDIARIO"}],
  "aiSummary": "Resumo em português de até 2 frases."
}`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
        temperature: 0.1,
        response_format: { type: 'json_object' },
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
        candidateName: typeof parsed.candidateName === 'string' && parsed.candidateName.trim() ? parsed.candidateName.trim() : null,
        candidateSkills: Array.isArray(parsed.candidateSkills) ? parsed.candidateSkills : [],
        candidateExperiences: sanitizeExperiences(parsed.candidateExperiences),
        candidateEducations: sanitizeEducations(parsed.candidateEducations),
        candidateLanguages: sanitizeLanguages(parsed.candidateLanguages),
        aiSummary: typeof parsed.aiSummary === 'string' ? parsed.aiSummary : null,
        engine: 'groq',
      };
    } catch (err: any) {
      this.logger.error(`Groq classification failed: ${err?.message ?? err}`);
      return fallback();
    }
  }
}
