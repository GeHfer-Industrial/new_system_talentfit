import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExitInterviewDto } from './dto/create-exit-interview.dto';
import {
  DEPARTMENTS,
  DEPARTURE_TYPES,
  DISMISSAL_REASONS,
  Option,
  RESIGNATION_REASONS,
  SCALE_QUESTIONS,
} from './exit-interview-content';

@Injectable()
export class ExitInterviewService {
  constructor(private readonly prisma: PrismaService) {}

  getMeta() {
    return {
      departments: DEPARTMENTS,
      departureTypes: DEPARTURE_TYPES,
      dismissalReasons: DISMISSAL_REASONS,
      resignationReasons: RESIGNATION_REASONS,
      questions: SCALE_QUESTIONS,
    };
  }

  async create(dto: CreateExitInterviewDto) {
    if (dto.departureType === 'DEMITIDO') {
      if (!dto.dismissalReason) {
        throw new BadRequestException('Informe o motivo da demissão');
      }
      if (dto.dismissalReason === 'OUTROS' && !dto.dismissalReasonOther?.trim()) {
        throw new BadRequestException('Especifique o motivo da demissão em "Outros"');
      }
      if (dto.resignationReason || dto.resignationReasonOther) {
        throw new BadRequestException('Não informe motivo de pedido de demissão para um colaborador demitido');
      }
    } else {
      if (!dto.resignationReason) {
        throw new BadRequestException('Informe o motivo do pedido de demissão');
      }
      if (dto.resignationReason === 'OUTROS' && !dto.resignationReasonOther?.trim()) {
        throw new BadRequestException('Especifique o motivo do pedido de demissão em "Outros"');
      }
      if (dto.dismissalReason || dto.dismissalReasonOther) {
        throw new BadRequestException('Não informe motivo de demissão para um colaborador que pediu demissão');
      }
    }

    if (new Date(dto.terminationDate) < new Date(dto.admissionDate)) {
      throw new BadRequestException('A data de demissão não pode ser anterior à data de admissão');
    }

    return this.prisma.exitInterview.create({
      data: {
        employeeName: dto.employeeName,
        position: dto.position,
        department: dto.department,
        admissionDate: new Date(dto.admissionDate),
        terminationDate: new Date(dto.terminationDate),
        interviewDate: new Date(dto.interviewDate),
        interviewerName: dto.interviewerName,
        departureType: dto.departureType,
        dismissalReason: dto.dismissalReason,
        dismissalReasonOther: dto.dismissalReasonOther,
        resignationReason: dto.resignationReason,
        resignationReasonOther: dto.resignationReasonOther,
        toolsSupport: dto.toolsSupport,
        healthyEnvironment: dto.healthyEnvironment,
        teamRelationship: dto.teamRelationship,
        leadershipRelationship: dto.leadershipRelationship,
        receivedFeedback: dto.receivedFeedback,
        couldSuggestIdeas: dto.couldSuggestIdeas,
        feltValued: dto.feltValued,
        growthOpportunities: dto.growthOpportunities,
        clearProcedures: dto.clearProcedures,
        healthSafety: dto.healthSafety,
        benefitsRating: dto.benefitsRating,
        likedMost: dto.likedMost,
        improvementSuggestions: dto.improvementSuggestions,
        wouldRecommend: dto.wouldRecommend,
        finalComments: dto.finalComments,
      },
    });
  }

  async findAll(filters: { department?: string; departureType?: string }) {
    return this.prisma.exitInterview.findMany({
      where: {
        department: filters.department,
        departureType: filters.departureType,
      },
      orderBy: { interviewDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const interview = await this.prisma.exitInterview.findUnique({ where: { id } });
    if (!interview) throw new NotFoundException(`Entrevista ${id} não encontrada`);
    return interview;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.exitInterview.delete({ where: { id } });
  }

  async getStats(department?: string) {
    const rows = await this.prisma.exitInterview.findMany({
      where: department ? { department } : undefined,
      select: {
        department: true,
        departureType: true,
        dismissalReason: true,
        resignationReason: true,
        toolsSupport: true,
        healthyEnvironment: true,
        teamRelationship: true,
        leadershipRelationship: true,
        receivedFeedback: true,
        couldSuggestIdeas: true,
        feltValued: true,
        growthOpportunities: true,
        clearProcedures: true,
        healthSafety: true,
        benefitsRating: true,
      },
    });

    const total = rows.length;

    const countByOption = (values: (string | null)[], options: Option[]) =>
      options.map((opt) => ({
        value: opt.value,
        label: opt.label,
        count: values.filter((v) => v === opt.value).length,
      }));

    const byDepartment = DEPARTMENTS.map((dep) => ({
      department: dep,
      count: rows.filter((r) => r.department === dep).length,
    })).filter((d) => d.count > 0);

    const departureType = countByOption(rows.map((r) => r.departureType), DEPARTURE_TYPES);
    const dismissalReasons = countByOption(rows.map((r) => r.dismissalReason), DISMISSAL_REASONS);
    const resignationReasons = countByOption(rows.map((r) => r.resignationReason), RESIGNATION_REASONS);

    const questions = SCALE_QUESTIONS.map((q) => ({
      key: q.key,
      label: q.label,
      breakdown: countByOption(
        rows.map((r) => r[q.key]),
        q.options,
      ),
    }));

    return { total, byDepartment, departureType, dismissalReasons, resignationReasons, questions };
  }
}
