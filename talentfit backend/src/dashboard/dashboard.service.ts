import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalResumes, openJobs, classifiedToday, talentPoolTotal, byDepartmentRaw] =
      await Promise.all([
        this.prisma.resume.count(),
        this.prisma.job.count({ where: { status: JobStatus.OPEN } }),
        this.prisma.resume.count({
          where: { createdAt: { gte: todayStart } },
        }),
        this.prisma.talentPool.count(),
        this.prisma.job.findMany({
          where: { status: JobStatus.OPEN },
          select: {
            department: true,
            _count: { select: { resumes: true } },
          },
        }),
      ]);

    const byDepartment = byDepartmentRaw.map((j) => ({
      department: j.department,
      count: j._count.resumes,
    }));

    return {
      totalResumes,
      openJobs,
      classifiedToday,
      talentPoolTotal,
      byDepartment,
    };
  }

  async getRecentResumes() {
    return this.prisma.resume.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        candidate: true,
        job: { select: { title: true, department: true } },
      },
    });
  }
}
