import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDigitalResumeDto } from './dto/create-digital-resume.dto';

@Injectable()
export class DigitalResumeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDigitalResumeDto) {
    const preRegistration = await this.prisma.candidatePreRegistration.findUnique({
      where: { id: dto.preRegistrationId },
    });
    if (!preRegistration) {
      throw new NotFoundException('Pré-cadastro não encontrado');
    }

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
  }
}
