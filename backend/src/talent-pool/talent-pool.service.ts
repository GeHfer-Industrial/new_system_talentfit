import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { ApprovalStatus, Classification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClassificationService } from '../classification/classification.service';
import { ClassificationRateLimitError } from '../classification/engine/groq.engine';

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
    let rateLimited = false;

    for (const entry of entries) {
      const resume = entry.candidate.resumes[0];
      if (!resume?.extractedText) continue;

      let result;
      try {
        result = await this.classificationService.classify(resume.extractedText);
      } catch (err) {
        if (err instanceof ClassificationRateLimitError) {
          rateLimited = true;
          break;
        }
        throw err;
      }
      const stillTalentPool = result.classification === Classification.TALENT_POOL;

      await this.prisma.resume.update({
        where: { id: resume.id },
        data: {
          score: result.score,
          classification: result.classification,
          // Reclassificação automática só atualiza a sugestão da IA. Quando deixa de
          // ser "sem vaga compatível", volta para PENDING (fila de Currículos) — só
          // vira APPROVED quando o RH clica em Aprovar/Associar a vaga de fato.
          approvalStatus: stillTalentPool ? undefined : ApprovalStatus.PENDING,
          jobId: stillTalentPool ? null : result.jobId ?? undefined,
          extractedSkills: result.candidateSkills.length
            ? result.candidateSkills
            : result.matchedKeywords,
          aiSummary: result.aiSummary,
          classificationEngine: result.engine,
        },
      });

      processed++;
      if (!stillTalentPool) {
        nowCompatible++;
        await this.prisma.talentPool.delete({ where: { id: entry.id } });
      }
    }

    return { processed, nowCompatible, rateLimited };
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

    let result;
    try {
      result = await this.classificationService.classify(resume.extractedText);
    } catch (err) {
      if (err instanceof ClassificationRateLimitError) {
        throw new HttpException(err.message, HttpStatus.TOO_MANY_REQUESTS);
      }
      throw err;
    }
    const promoted = result.classification !== Classification.TALENT_POOL;

    await this.prisma.resume.update({
      where: { id: resume.id },
      data: {
        score: result.score,
        classification: result.classification,
        // Reclassificação automática — só volta pra fila (PENDING), nunca aprova direto.
        approvalStatus: promoted ? ApprovalStatus.PENDING : undefined,
        jobId: promoted ? result.jobId ?? undefined : null,
        extractedSkills: result.candidateSkills.length
          ? result.candidateSkills
          : result.matchedKeywords,
        aiSummary: result.aiSummary,
        classificationEngine: result.engine,
      },
    });

    if (promoted) {
      await this.prisma.talentPool.delete({ where: { candidateId } });
    }

    return { updated: true, classification: result.classification, promoted };
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
        data: { jobId, classification: 'COMPATIBLE', approvalStatus: ApprovalStatus.APPROVED },
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

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.talentPool.delete({ where: { candidateId } });
      await tx.resume.updateMany({
        where: { candidateId },
        data: { approvalStatus: ApprovalStatus.PENDING },
      });
      return deleted;
    });
  }
}
