import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ClassificationService } from '../classification/classification.service';
import { ClassificationRateLimitError } from '../classification/engine/groq.engine';
import { PdfExtractor } from './extractors/pdf.extractor';
import { DocxExtractor } from './extractors/docx.extractor';
import { ResumeStorageService } from './resume-storage.service';
import { ApprovalStatus, Classification, Prisma } from '@prisma/client';

interface ResumeFilters {
  classification?: Classification;
  approvalStatus?: ApprovalStatus;
  jobId?: string;
}

interface UpdateClassificationDto {
  classification: Classification;
  jobId?: string;
}

@Injectable()
export class ResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly classificationService: ClassificationService,
    private readonly pdfExtractor: PdfExtractor,
    private readonly docxExtractor: DocxExtractor,
    private readonly resumeStorageService: ResumeStorageService,
  ) {}

  async uploadAndProcess(
    file: Express.Multer.File,
    emailId?: string,
  ) {
    const extractedText = await this.extractText(file.buffer, file.mimetype);
    if (!extractedText.trim()) {
      throw new BadRequestException('Não foi possível extrair texto do arquivo');
    }

    const result = await this.classifyOrThrowFriendly(extractedText);

    const candidateName = result.candidateName ?? this.extractCandidateName(extractedText, file.originalname);

    const phoneMatch = extractedText.match(
      /(?:\+?55[\s-]?)?(?:\(?\d{2}\)?\s?)(?:9\s?)?\d{4}[-\s]?\d{4}/,
    );
    const emailMatch = extractedText.match(
      /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
    );

    const filename = `${randomUUID()}${path.extname(file.originalname)}`;
    await this.resumeStorageService.upload(filename, file.buffer, file.mimetype);

    const candidate = await this.prisma.candidate.create({
      data: {
        name: candidateName,
        resumeFile: filename,
        phone: phoneMatch?.[0]?.trim() ?? undefined,
        email: emailMatch?.[0]?.trim() ?? undefined,
      },
    });

    const resume = await this.prisma.resume.create({
      data: {
        candidateId: candidate.id,
        jobId: result.jobId ?? undefined,
        extractedText,
        extractedSkills: result.candidateSkills.length ? result.candidateSkills : result.matchedKeywords,
        extractedExperiences: result.candidateExperiences as unknown as Prisma.InputJsonValue,
        extractedEducations: result.candidateEducations as unknown as Prisma.InputJsonValue,
        extractedLanguages: result.candidateLanguages as unknown as Prisma.InputJsonValue,
        score: result.score,
        classification: result.classification,
        originalScore: result.score,
        originalClassification: result.classification,
        classificationEngine: result.engine,
        aiSummary: result.aiSummary,
        emailId: emailId ?? undefined,
      },
      include: { candidate: true, job: true },
    });

    return resume;
  }

  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf') {
      return this.pdfExtractor.extract(buffer);
    }
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return this.docxExtractor.extract(buffer);
    }
    throw new BadRequestException(`Tipo de arquivo não suportado: ${mimeType}`);
  }

  async findAll(filters?: ResumeFilters) {
    return this.prisma.resume.findMany({
      where: {
        ...(filters?.classification && { classification: filters.classification }),
        ...(filters?.approvalStatus && { approvalStatus: filters.approvalStatus }),
        ...(filters?.jobId && { jobId: filters.jobId }),
      },
      include: {
        candidate: {
          include: {
            preRegistration: { select: { id: true, behavioralResult: { select: { id: true } } } },
          },
        },
        job: { select: { id: true, title: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            preRegistration: {
              include: {
                behavioralResult: { include: { answers: true } },
                digitalResume: {
                  include: {
                    experiences: true,
                    educations: true,
                    languages: true,
                    desiredJob: { select: { id: true, title: true, department: true } },
                  },
                },
              },
            },
          },
        },
        job: true,
        email: true,
      },
    });
    if (!resume) throw new NotFoundException(`Currículo ${id} não encontrado`);
    return resume;
  }

  async updateClassification(id: string, dto: UpdateClassificationDto) {
    await this.findOne(id);

    // Esta função só é chamada a partir de uma ação explícita do RH (Aprovar,
    // Rejeitar, Banco de Talentos, Alterar vaga) — nunca automaticamente pela IA.
    // Por isso o approvalStatus é derivado diretamente da classificação escolhida aqui.
    const approvalStatus =
      dto.classification === Classification.TALENT_POOL ? ApprovalStatus.TALENT_POOL : ApprovalStatus.APPROVED;

    const resume = await this.prisma.resume.update({
      where: { id },
      data: {
        classification: dto.classification,
        approvalStatus,
        jobId: dto.jobId ?? null,
      },
      include: { candidate: true, job: true },
    });

    if (dto.classification === Classification.TALENT_POOL) {
      await this.prisma.talentPool.upsert({
        where: { candidateId: resume.candidateId },
        update: {},
        create: { candidateId: resume.candidateId },
      });
    } else {
      await this.prisma.talentPool.deleteMany({ where: { candidateId: resume.candidateId } });
    }

    return resume;
  }

  private async classifyOrThrowFriendly(extractedText: string) {
    try {
      return await this.classificationService.classify(extractedText);
    } catch (err) {
      if (err instanceof ClassificationRateLimitError) {
        throw new HttpException(err.message, HttpStatus.TOO_MANY_REQUESTS);
      }
      throw err;
    }
  }

  private async classifyAndUpdate(resume: { id: string; extractedText: string }) {
    const result = await this.classificationService.classify(resume.extractedText);
    return this.prisma.resume.update({
      where: { id: resume.id },
      data: {
        jobId: result.classification === Classification.TALENT_POOL ? null : result.jobId ?? undefined,
        score: result.score,
        classification: result.classification,
        extractedSkills: result.candidateSkills.length ? result.candidateSkills : result.matchedKeywords,
        extractedExperiences: result.candidateExperiences as unknown as Prisma.InputJsonValue,
        extractedEducations: result.candidateEducations as unknown as Prisma.InputJsonValue,
        extractedLanguages: result.candidateLanguages as unknown as Prisma.InputJsonValue,
        classificationEngine: result.engine,
        aiSummary: result.aiSummary,
      },
      include: { candidate: true, job: true },
    });
  }

  async reclassify(id: string) {
    const resume = await this.findOne(id);
    if (!resume.extractedText) throw new BadRequestException('Currículo não possui texto extraído');
    try {
      return await this.classifyAndUpdate(resume);
    } catch (err) {
      if (err instanceof ClassificationRateLimitError) {
        throw new HttpException(err.message, HttpStatus.TOO_MANY_REQUESTS);
      }
      throw err;
    }
  }

  async reclassifyPending() {
    const resumes = await this.prisma.resume.findMany({
      where: { approvalStatus: ApprovalStatus.PENDING, classification: Classification.TALENT_POOL },
      select: { id: true, extractedText: true },
    });

    let processed = 0;
    let nowCompatible = 0;
    let rateLimited = false;

    for (const resume of resumes) {
      if (!resume.extractedText) continue;
      try {
        const updated = await this.classifyAndUpdate(resume);
        processed++;
        if (updated.classification !== Classification.TALENT_POOL) nowCompatible++;
      } catch (err) {
        if (err instanceof ClassificationRateLimitError) {
          rateLimited = true;
          break;
        }
        throw err;
      }
    }

    return { processed, nowCompatible, rateLimited };
  }

  async remove(id: string) {
    const resume = await this.findOne(id);
    if (resume.candidate.resumeFile) {
      await this.resumeStorageService.remove(resume.candidate.resumeFile);
    }
    return this.prisma.resume.delete({ where: { id } });
  }

  private extractCandidateName(text: string, filename: string): string {
    const namePattern = /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+(?:de|da|do|dos|das|e\s+)?[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+){1,4}$/;
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    for (const line of lines.slice(0, 6)) {
      if (namePattern.test(line) && line.length <= 60) return line;
    }
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const base = path.basename(filename, path.extname(filename));
    if (!uuidPattern.test(base)) return base.replace(/[-_]/g, ' ').trim();
    return 'Candidato';
  }
}
