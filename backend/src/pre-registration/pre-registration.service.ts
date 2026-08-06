import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePreRegistrationDto } from './dto/create-pre-registration.dto';

@Injectable()
export class PreRegistrationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePreRegistrationDto) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id: dto.candidateId } });
    if (!candidate) {
      throw new NotFoundException('Link inválido — candidato não encontrado');
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
