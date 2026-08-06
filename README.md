# TalentFit

Plataforma de triagem automática de currículos para equipes de RH. O sistema lê e-mails corporativos, extrai currículos em PDF/DOCX, pontua candidatos contra vagas cadastradas e organiza os resultados em um painel.
 
---

## Visão Geral

- **Backend**: NestJS + TypeScript + PostgreSQL (Supabase) + Prisma
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Auth**: Supabase Auth (JWT)
- **Classificação**: motor por palavras-chave, substituível por IA

---

## Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com) com projeto criado

---

## Instalação Rápida

```bash
# 1. Backend
cd "talentfit backend"
npm install
# Configure .env (copie .env.example e preencha)
npx prisma generate
npm run dev

# 2. Frontend (outro terminal)
cd "talentfit frontend"
npm install
# Configure .env (copie .env.example e preencha)
npm run dev
```

> **Banco de dados**: Execute o SQL em `prisma/migrations/init.sql` no SQL Editor do Supabase para criar as tabelas.

---

## Variáveis de Ambiente

### Backend (`talentfit backend/.env`)

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | Connection string Supabase (pooler) | `postgresql://postgres.xxx:SENHA@pooler.supabase.com:6543/postgres` |
| `SUPABASE_URL` | URL do projeto Supabase | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Chave anônima pública | `eyJ...` |
| `SUPABASE_JWT_SECRET` | Chave service_role (para validar JWT) | `eyJ...` |
| `JWT_SECRET` | Secret local (fallback) | qualquer string |
| `PORT` | Porta do servidor | `3333` |
| `UPLOAD_DIR` | Diretório de uploads | `./uploads` |
| `MIN_SCORE_TO_MATCH` | Score mínimo para COMPATIBLE | `40` |

### Frontend (`talentfit frontend/.env`)

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL do backend (ex: `http://localhost:3333`) |
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima pública |

---

## Estrutura do Projeto

```
talentfit/
├── talentfit backend/
│   ├── src/
│   │   ├── auth/           # JWT + Supabase auth
│   │   ├── jobs/           # CRUD de vagas + keywords
│   │   ├── candidates/     # Candidatos
│   │   ├── resume/         # Upload, extração e processamento
│   │   ├── classification/ # Motor de pontuação
│   │   ├── email/          # Sincronização IMAP
│   │   ├── talent-pool/    # Banco de talentos
│   │   └── dashboard/      # Estatísticas
│   └── prisma/
│       ├── schema.prisma
│       ├── seed.ts
│       └── migrations/init.sql
└── talentfit frontend/
    └── src/
        ├── pages/          # Login, Dashboard, Jobs, Resumes, TalentPool, ...
        ├── components/     # Layout, UI primitives, features
        ├── hooks/          # React Query + API
        └── lib/            # Supabase client, Axios, QueryClient
```

---

## API

Swagger disponível em: `http://localhost:3333/api/docs`

---

## Fluxo de Classificação

1. Currículo PDF/DOCX é enviado via upload ou e-mail
2. Texto é extraído (pdf-parse para PDF, mammoth para DOCX)
3. O `KeywordClassificationEngine` compara o texto com as keywords de cada vaga aberta
4. Pontuação: **+pointsRequired** por keyword obrigatória, **+pointsDesired** por desejável
5. Vaga com maior score é selecionada
6. Resultado: `COMPATIBLE` (score ≥ minScore), `PARTIAL` (score > 0), `TALENT_POOL` (score = 0)

---

## Extensão com IA

Para substituir o motor por palavras-chave por OpenAI/Claude:

```typescript
// classification/engine/ai.engine.ts
@Injectable()
export class AiClassificationEngine implements IClassificationEngine {
  classify(resumeText, jobs, config): ClassificationResult {
    // Chamar OpenAI / Anthropic aqui
  }
}

// classification/classification.module.ts
{ provide: CLASSIFICATION_ENGINE, useClass: AiClassificationEngine }
```

O token `CLASSIFICATION_ENGINE` desacopla a implementação — nenhum consumer precisa ser alterado.

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia em modo watch (backend ou frontend) |
| `npm run build` | Build de produção |
| `npm run start:prod` | Inicia build de produção (backend) |
| `npm run prisma:migrate` | Cria e aplica migration |
| `npm run prisma:studio` | Abre Prisma Studio |
| `npm run seed` | Popula banco com dados iniciais |
# system_talentfit
