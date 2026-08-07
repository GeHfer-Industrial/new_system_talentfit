import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobStatus } from '@prisma/client';

interface JobFilters {
  status?: JobStatus;
  department?: string;
}

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateJobDto) {
    const { keywords, ...jobData } = dto;
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.create({ data: jobData });
      if (keywords?.length) {
        await tx.jobKeyword.createMany({
          data: keywords.map((k) => ({ ...k, jobId: job.id })),
        });
      }
      return tx.job.findUnique({
        where: { id: job.id },
        include: { keywords: true },
      });
    });
  }

  async findAllPublic() {
    return this.prisma.job.findMany({
      where: { status: JobStatus.OPEN },
      select: { id: true, title: true, department: true },
      orderBy: { title: 'asc' },
    });
  }

  async findAll(filters?: JobFilters) {
    return this.prisma.job.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.department && { department: filters.department }),
      },
      include: {
        keywords: true,
        _count: { select: { resumes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { keywords: true, _count: { select: { resumes: true } } },
    });
    if (!job) throw new NotFoundException(`Vaga ${id} não encontrada`);
    return job;
  }

  async update(id: string, dto: UpdateJobDto) {
    await this.findOne(id);
    const { keywords, ...jobData } = dto;
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.update({ where: { id }, data: jobData });
      if (keywords !== undefined) {
        await tx.jobKeyword.deleteMany({ where: { jobId: id } });
        if (keywords.length) {
          await tx.jobKeyword.createMany({
            data: keywords.map((k) => ({ ...k, jobId: id })),
          });
        }
      }
      return tx.job.findUnique({
        where: { id: job.id },
        include: { keywords: true },
      });
    });
  }

  async toggleStatus(id: string) {
    const job = await this.findOne(id);
    return this.prisma.job.update({
      where: { id },
      data: {
        status: job.status === JobStatus.OPEN ? JobStatus.CLOSED : JobStatus.OPEN,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.job.delete({ where: { id } });
  }
}
