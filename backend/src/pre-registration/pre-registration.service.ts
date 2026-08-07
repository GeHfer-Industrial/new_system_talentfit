import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePreRegistrationDto } from './dto/create-pre-registration.dto';

@Injectable()
export class PreRegistrationService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(candidateId: string) {
    const [preRegistration, resume] = await Promise.all([
      this.prisma.candidatePreRegistration.findUnique({
        where: { candidateId },
        include: { behavioralResult: true },
      }),
      this.prisma.resume.findFirst({
        where: { candidateId },
        orderBy: { createdAt: 'desc' },
        select: { extractedSkills: true, extractedExperiences: true, extractedEducations: true, extractedLanguages: true },
      }),
    ]);

    return {
      completed: !!preRegistration?.behavioralResult,
      extractedSkills: resume?.extractedSkills ?? [],
      extractedExperiences: resume?.extractedExperiences ?? [],
      extractedEducations: resume?.extractedEducations ?? [],
      extractedLanguages: resume?.extractedLanguages ?? [],
    };
  }

  async create(dto: CreatePreRegistrationDto) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: dto.candidateId },
      include: { preRegistration: { include: { behavioralResult: true } } },
    });
    if (!candidate) {
      throw new NotFoundException('Link inválido — candidato não encontrado');
    }
    if (candidate.preRegistration?.behavioralResult) {
      throw new ForbiddenException('Este processo já foi concluído e não pode mais ser alterado.');
    }

    const data = {
      name: dto.name,
      email: dto.email,
      birthPlace: dto.birthPlace,
      birthDate: new Date(dto.birthDate),
      rg: dto.rg,
      cpf: dto.cpf,
      fatherName: dto.fatherName,
      motherName: dto.motherName,
    };

    return this.prisma.candidatePreRegistration.upsert({
      where: { candidateId: candidate.id },
      update: data,
      create: { ...data, candidateId: candidate.id },
    });
  }
}
