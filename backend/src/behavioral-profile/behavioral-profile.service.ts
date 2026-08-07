import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryCode, PROFILES, QUADRANTS, QUESTIONS } from './behavioral-content';
import { SubmitBehavioralResultDto } from './dto/submit-behavioral-result.dto';

@Injectable()
export class BehavioralProfileService {
  constructor(private readonly prisma: PrismaService) {}

  getQuestions() {
    return QUESTIONS;
  }

  getContent() {
    return { profiles: Object.values(PROFILES), quadrants: Object.values(QUADRANTS) };
  }

  async submitResult(dto: SubmitBehavioralResultDto) {
    const existing = await this.prisma.behavioralResult.findUnique({
      where: { preRegistrationId: dto.preRegistrationId },
    });
    if (existing) {
      throw new ForbiddenException('Este questionário já foi respondido e não pode ser refeito.');
    }

    const orders = dto.answers.map((a) => a.questionOrder);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== QUESTIONS.length || QUESTIONS.some((q) => !uniqueOrders.has(q.order))) {
      throw new BadRequestException('É necessário responder todas as 25 perguntas, uma única vez cada');
    }

    const points: Record<CategoryCode, number> = { E: 0, C: 0, A: 0, V: 0 };
    const answerRows = dto.answers.map((answer) => {
      const question = QUESTIONS.find((q) => q.order === answer.questionOrder);
      if (!question) {
        throw new BadRequestException(`Pergunta ${answer.questionOrder} não encontrada`);
      }
      points[answer.categoryCode] += 1;
      return {
        questionOrder: question.order,
        questionText: question.text,
        answerText: question.alternatives[answer.categoryCode],
        categoryCode: answer.categoryCode,
      };
    });

    const ranked = (Object.keys(points) as CategoryCode[]).sort((a, b) => points[b] - points[a]);
    const dominantProfile = ranked[0];
    const secondaryProfile = ranked[1];

    const pct = (a: CategoryCode, b: CategoryCode) => ((points[a] + points[b]) / 50) * 100;
    const pctInspiracao = pct(...QUADRANTS.INSPIRACAO.categories);
    const pctImpulso = pct(...QUADRANTS.IMPULSO.categories);
    const pctExecucao = pct(...QUADRANTS.EXECUCAO.categories);
    const pctEstrategia = pct(...QUADRANTS.ESTRATEGIA.categories);

    return this.prisma.behavioralResult.create({
      data: {
        preRegistrationId: dto.preRegistrationId,
        pointsE: points.E,
        pointsC: points.C,
        pointsA: points.A,
        pointsV: points.V,
        dominantProfile,
        secondaryProfile,
        pctInspiracao,
        pctImpulso,
        pctExecucao,
        pctEstrategia,
        answers: { createMany: { data: answerRows } },
      },
      include: { answers: { orderBy: { questionOrder: 'asc' } } },
    });
  }
}
