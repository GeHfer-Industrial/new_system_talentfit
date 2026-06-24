import { PrismaClient, Role, KeywordType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.classificationConfig.deleteMany();
  await prisma.jobKeyword.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();

  await prisma.classificationConfig.create({
    data: { pointsRequired: 20, pointsDesired: 10, minScoreToMatch: 40 },
  });

  await prisma.user.createMany({
    data: [
      { name: 'Admin TalentFit', email: 'admin@talentfit.com', role: Role.ADMIN },
      { name: 'Recrutador', email: 'recruiter@talentfit.com', role: Role.RECRUITER },
    ],
  });

  await prisma.job.create({
    data: {
      title: 'Desenvolvedor Backend',
      department: 'Tecnologia',
      description: 'Desenvolvedor focado em APIs REST com Node.js e TypeScript.',
      keywords: {
        createMany: {
          data: [
            { keyword: 'Node.js', type: KeywordType.REQUIRED },
            { keyword: 'TypeScript', type: KeywordType.REQUIRED },
            { keyword: 'REST API', type: KeywordType.REQUIRED },
            { keyword: 'Docker', type: KeywordType.DESIRED },
            { keyword: 'AWS', type: KeywordType.DESIRED },
            { keyword: 'NestJS', type: KeywordType.DESIRED },
          ],
        },
      },
    },
  });

  await prisma.job.create({
    data: {
      title: 'Analista de Marketing',
      department: 'Marketing',
      description: 'Profissional para estratégias de marketing digital e conteúdo.',
      keywords: {
        createMany: {
          data: [
            { keyword: 'SEO', type: KeywordType.REQUIRED },
            { keyword: 'Google Analytics', type: KeywordType.REQUIRED },
            { keyword: 'Copywriting', type: KeywordType.REQUIRED },
            { keyword: 'HubSpot', type: KeywordType.DESIRED },
            { keyword: 'Inbound', type: KeywordType.DESIRED },
          ],
        },
      },
    },
  });

  await prisma.job.create({
    data: {
      title: 'Analista Financeiro',
      department: 'Financeiro',
      description: 'Analista para controle financeiro, conciliação e relatórios.',
      keywords: {
        createMany: {
          data: [
            { keyword: 'Excel', type: KeywordType.REQUIRED },
            { keyword: 'Conciliação', type: KeywordType.REQUIRED },
            { keyword: 'SAP', type: KeywordType.REQUIRED },
            { keyword: 'Power BI', type: KeywordType.DESIRED },
            { keyword: 'VBA', type: KeywordType.DESIRED },
          ],
        },
      },
    },
  });

  console.log('Seed executado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
