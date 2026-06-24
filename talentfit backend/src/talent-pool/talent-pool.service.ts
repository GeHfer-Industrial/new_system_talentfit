import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClassificationService } from '../classification/classification.service';

@Injectable()
export class TalentPoolService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly classificationService: ClassificationService,
  ) {}

  async findAll(search?: string, jobId?: string) {
    const [entries, openJobs] = await Promise.all([
      this.prisma.talentPool.findMany({
        where: {
          candidate: search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              }
            : undefined,
        },
        include: {
          candidate: {
            include: {
              resumes: {
                orderBy: { score: 'desc' },
                take: 1,
                select: { extractedSkills: true, aiSummary: true, score: true },
              },
            },
          },
        },
        orderBy: { addedAt: 'desc' },
      }),
      this.prisma.job.findMany({
        where: { status: 'OPEN' },
        select: {
          id: true,
          title: true,
          department: true,
          keywords: { select: { keyword: true } },
        },
      }),
    ]);

    const enriched = entries.map((entry) => {
      const skills = (entry.candidate.resumes[0]?.extractedSkills ?? []).map(
        (s) => s.toLowerCase(),
      );

      const suggestedJobs = openJobs
        .filter((job) =>
          job.keywords.some((kw) => skills.includes(kw.keyword.toLowerCase())),
        )
        .map((job) => ({ id: job.id, title: job.title, department: job.department }));

      return { ...entry, suggestedJobs };
    });

    if (jobId) {
      return enriched.filter((e) => e.suggestedJobs.some((j) => j.id === jobId));
    }

    return enriched;
  }

  async reEvaluate() {
    const entries = await this.prisma.talentPool.findMany({
      include: {
        candidate: {
          include: {
            resumes: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true, extractedText: true },
            },
          },
        },
      },
    });

    let processed = 0;
    let nowCompatible = 0;

    for (const entry of entries) {
      const resume = entry.candidate.resumes[0];
      if (!resume?.extractedText) continue;

      const result = await this.classificationService.classify(resume.extractedText);

      await this.prisma.resume.update({
        where: { id: resume.id },
        data: {
          extractedSkills: result.candidateSkills.length
            ? result.candidateSkills
            : result.matchedKeywords,
          aiSummary: result.aiSummary,
          classificationEngine: result.engine,
        },
      });

      processed++;
      if (result.classification !== 'TALENT_POOL') nowCompatible++;
    }

    return { processed, nowCompatible };
  }

  async reEvaluateOne(candidateId: string) {
    const entry = await this.prisma.talentPool.findUnique({
      where: { candidateId },
      include: {
        candidate: {
          include: {
            resumes: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true, extractedText: true },
            },
          },
        },
      },
    });

    if (!entry) throw new NotFoundException('Candidato não está no banco de talentos');

    const resume = entry.candidate.resumes[0];
    if (!resume?.extractedText) throw new NotFoundException('Candidato não possui texto de currículo');

    const result = await this.classificationService.classify(resume.extractedText);

    await this.prisma.resume.update({
      where: { id: resume.id },
      data: {
        extractedSkills: result.candidateSkills.length
          ? result.candidateSkills
          : result.matchedKeywords,
        aiSummary: result.aiSummary,
        classificationEngine: result.engine,
      },
    });

    return { updated: true, classification: result.classification };
  }

  async associateToJob(candidateId: string, jobId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { resumes: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!candidate) throw new NotFoundException('Candidato não encontrado');

    const resume = candidate.resumes[0];
    if (!resume) throw new NotFoundException('Candidato não possui currículo');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.resume.update({
        where: { id: resume.id },
        data: { jobId, classification: 'COMPATIBLE' },
        include: { candidate: true, job: true },
      });

      await tx.talentPool.deleteMany({ where: { candidateId } });

      return updated;
    });
  }

  async remove(candidateId: string) {
    const entry = await this.prisma.talentPool.findUnique({
      where: { candidateId },
    });
    if (!entry) throw new NotFoundException('Candidato não está no banco de talentos');
    return this.prisma.talentPool.delete({ where: { candidateId } });
  }
}
