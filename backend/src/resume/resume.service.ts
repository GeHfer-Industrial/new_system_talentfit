import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { ClassificationService } from '../classification/classification.service';
import { PdfExtractor } from './extractors/pdf.extractor';
import { DocxExtractor } from './extractors/docx.extractor';
import { Classification, Prisma } from '@prisma/client';

interface ResumeFilters {
  classification?: Classification;
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
    private readonly configService: ConfigService,
  ) {}

  async uploadAndProcess(
    file: Express.Multer.File,
    emailId?: string,
  ) {
    const extractedText = await this.extractText(file.path, file.mimetype);
    if (!extractedText.trim()) {
      throw new BadRequestException('Não foi possível extrair texto do arquivo');
    }

    const result = await this.classificationService.classify(extractedText);

    const candidateName = this.extractCandidateName(extractedText, file.originalname);

    const phoneMatch = extractedText.match(
      /(?:\+?55[\s-]?)?(?:\(?\d{2}\)?\s?)(?:9\s?)?\d{4}[-\s]?\d{4}/,
    );
    const emailMatch = extractedText.match(
      /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
    );

    const candidate = await this.prisma.candidate.create({
      data: {
        name: candidateName,
        resumeFile: file.filename,
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
        classificationEngine: result.engine,
        aiSummary: result.aiSummary,
        emailId: emailId ?? undefined,
      },
      include: { candidate: true, job: true },
    });

    if (result.classification === Classification.TALENT_POOL) {
      await this.prisma.talentPool.upsert({
        where: { candidateId: candidate.id },
        update: {},
        create: { candidateId: candidate.id },
      });
    }

    return resume;
  }

  async extractText(filePath: string, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf' || filePath.endsWith('.pdf')) {
      return this.pdfExtractor.extract(filePath);
    }
    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filePath.endsWith('.docx')
    ) {
      return this.docxExtractor.extract(filePath);
    }
    throw new BadRequestException(`Tipo de arquivo não suportado: ${mimeType}`);
  }

  async findAll(filters?: ResumeFilters) {
    return this.prisma.resume.findMany({
      where: {
        classification: filters?.classification
          ? filters.classification
          : { not: Classification.TALENT_POOL },
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
    const resume = await this.prisma.resume.update({
      where: { id },
      data: {
        classification: dto.classification,
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
    }

    return resume;
  }

  async remove(id: string) {
    const resume = await this.findOne(id);
    const uploadDir = this.getUploadDir();
    const filePath = path.join(uploadDir, resume.candidate.resumeFile ?? '');
    if (resume.candidate.resumeFile && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
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

  getUploadDir(): string {
    const configured = this.configService.get<string>('UPLOAD_DIR');
    const dir = configured ?? (process.env.VERCEL ? '/tmp' : './uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
}
