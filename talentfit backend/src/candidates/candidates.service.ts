import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.candidate.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        resumes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        talentPool: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        resumes: { include: { job: true } },
        talentPool: true,
      },
    });
    if (!candidate) throw new NotFoundException(`Candidato ${id} não encontrado`);
    return candidate;
  }

  async update(id: string, dto: UpdateCandidateDto) {
    await this.findOne(id);
    return this.prisma.candidate.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.candidate.delete({ where: { id } });
  }
}
