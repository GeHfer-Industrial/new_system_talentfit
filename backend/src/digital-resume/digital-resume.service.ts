import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Classification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClassificationService } from '../classification/classification.service';
import { CreateDigitalResumeDto } from './dto/create-digital-resume.dto';

interface EnrichmentData {
  skills: string[];
  experiences: { role: string; company: string; description: string | null }[];
  educations: { course: string; institution: string; level: string; status: string }[];
  languages: { language: string; level: string }[];
}

@Injectable()
export class DigitalResumeService {
  private readonly logger = new Logger(DigitalResumeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly classificationService: ClassificationService,
  ) {}
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDigitalResumeDto } from './dto/create-digital-resume.dto';

@Injectable()
export class DigitalResumeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDigitalResumeDto) {
    const preRegistration = await this.prisma.candidatePreRegistration.findUnique({
      where: { id: dto.preRegistrationId },
      include: { behavioralResult: true },
    });
    if (!preRegistration) {
      throw new NotFoundException('Pré-cadastro não encontrado');
    }
    if (preRegistration.behavioralResult) {
      throw new ForbiddenException('Este processo já foi concluído e não pode mais ser alterado.');
    }

    const digitalResume = await this.prisma.$transaction(async (tx) => {

    return this.prisma.$transaction(async (tx) => {
      const digitalResume = await tx.digitalResume.upsert({
        where: { preRegistrationId: dto.preRegistrationId },
        update: { skills: dto.skills ?? [], desiredJobId: dto.desiredJobId ?? null },
        create: {
          preRegistrationId: dto.preRegistrationId,
          skills: dto.skills ?? [],
          desiredJobId: dto.desiredJobId ?? null,
        },
      });

      await tx.workExperience.deleteMany({ where: { digitalResumeId: digitalResume.id } });
      await tx.education.deleteMany({ where: { digitalResumeId: digitalResume.id } });
      await tx.languageSkill.deleteMany({ where: { digitalResumeId: digitalResume.id } });

      if (dto.experiences?.length) {
        await tx.workExperience.createMany({
          data: dto.experiences.map((e) => ({
            digitalResumeId: digitalResume.id,
            company: e.company,
            role: e.role,
            startDate: new Date(e.startDate),
            endDate: e.endDate ? new Date(e.endDate) : null,
            current: e.current ?? false,
            description: e.description,
          })),
        });
      }

      if (dto.educations?.length) {
        await tx.education.createMany({
          data: dto.educations.map((e) => ({
            digitalResumeId: digitalResume.id,
            institution: e.institution,
            course: e.course,
            level: e.level,
            status: e.status,
            startDate: e.startDate ? new Date(e.startDate) : null,
            endDate: e.endDate ? new Date(e.endDate) : null,
          })),
        });
      }

      if (dto.languages?.length) {
        await tx.languageSkill.createMany({
          data: dto.languages.map((l) => ({
            digitalResumeId: digitalResume.id,
            language: l.language,
            level: l.level,
          })),
        });
      }

      return tx.digitalResume.findUnique({
        where: { id: digitalResume.id },
        include: {
          experiences: true,
          educations: true,
          languages: true,
          desiredJob: { select: { id: true, title: true, department: true } },
        },
      });
    });

    if (preRegistration.candidateId && digitalResume) {
      await this.reScoreCandidate(preRegistration.candidateId, digitalResume);
    }

    return digitalResume;
  }

  private buildEnrichedText(baseText: string, data: EnrichmentData): string {
    const parts = [baseText];

    if (data.skills.length) {
      parts.push(`Habilidades informadas pelo candidato: ${data.skills.join(', ')}`);
    }
    for (const exp of data.experiences) {
      parts.push(
        `Experiência profissional: ${exp.role} na empresa ${exp.company}.${exp.description ? ` ${exp.description}` : ''}`,
      );
    }
    for (const edu of data.educations) {
      parts.push(`Formação acadêmica: ${edu.course} em ${edu.institution} (${edu.level}, ${edu.status}).`);
    }
    for (const lang of data.languages) {
      parts.push(`Idioma: ${lang.language} — nível ${lang.level}.`);
    }

    return parts.join('\n\n');
  }

  private async reScoreCandidate(candidateId: string, data: EnrichmentData) {
    try {
      const resume = await this.prisma.resume.findFirst({
        where: { candidateId },
        orderBy: { createdAt: 'desc' },
      });
      if (!resume) return;

      const enrichedText = this.buildEnrichedText(resume.extractedText, data);
      const result = await this.classificationService.classify(enrichedText);

      await this.prisma.resume.update({
        where: { id: resume.id },
        data: {
          score: result.score,
          classification: result.classification,
          jobId: result.classification === Classification.TALENT_POOL ? null : result.jobId ?? undefined,
          classificationEngine: result.engine,
          aiSummary: result.aiSummary,
        },
      });

      if (result.classification === Classification.TALENT_POOL) {
        await this.prisma.talentPool.upsert({
          where: { candidateId },
          update: {},
          create: { candidateId },
        });
      } else {
        await this.prisma.talentPool.deleteMany({ where: { candidateId } });
      }
    } catch (err) {
      this.logger.error(
        `Erro ao reavaliar score do candidato ${candidateId} após currículo digital`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}
