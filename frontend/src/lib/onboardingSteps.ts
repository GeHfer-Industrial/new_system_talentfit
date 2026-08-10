import type { Side } from 'driver.js'
import { UserRole } from '../hooks/useCurrentUser'

export interface OnboardingStep {
  path: string
  selector: string
  title: string
  description: string
  side: Side
  roles: UserRole[]
}

const ALL: UserRole[] = ['ADMIN', 'RECRUITER', 'VIEWER']
const OPERATORS: UserRole[] = ['ADMIN', 'RECRUITER']

export const onboardingSteps: OnboardingStep[] = [
  {
    path: '/dashboard',
    selector: '[data-tour="brand"]',
    title: '👋 Bem-vindo ao TalentFit',
    description:
      'Vamos fazer um tour rápido pelas principais telas do sistema. Você pode fechar quando quiser e reabrir esse tutorial depois pelo menu.',
    side: 'right',
    roles: ALL,
  },
  {
    path: '/dashboard',
    selector: '[data-tour="dashboard-stats"]',
    title: '📊 Visão geral',
    description:
      'Contagem geral de currículos recebidos, vagas abertas no momento, quantos currículos foram classificados hoje e quantos estão no Banco de Talentos.',
    side: 'bottom',
    roles: ALL,
  },
  {
    path: '/dashboard',
    selector: '[data-tour="dashboard-chart"]',
    title: 'Currículos por departamento',
    description: 'Mostra quantos currículos chegaram para cada área da empresa.',
    side: 'right',
    roles: ALL,
  },
  {
    path: '/dashboard',
    selector: '[data-tour="dashboard-recent"]',
    title: 'Últimos classificados',
    description:
      'Os currículos mais recentes já avaliados pela IA, com o placar de compatibilidade e a classificação de cada candidato.',
    side: 'left',
    roles: ALL,
  },
  {
    path: '/jobs',
    selector: '[data-tour="jobs-new"]',
    title: '💼 Vagas',
    description:
      'Aqui você cadastra as vagas abertas. Clique em "Nova Vaga" para criar uma e definir palavras-chave obrigatórias e desejadas — é isso que a IA usa pra avaliar os currículos.',
    side: 'bottom',
    roles: OPERATORS,
  },
  {
    path: '/jobs',
    selector: '[data-tour="jobs-filter"]',
    title: 'Filtrar vagas',
    description: 'Veja só as vagas abertas, só as fechadas, ou todas de uma vez.',
    side: 'bottom',
    roles: OPERATORS,
  },
  {
    path: '/jobs',
    selector: '[data-tour="jobs-grid"]',
    title: 'Cards de vaga',
    description:
      'Cada vaga aparece aqui com suas palavras-chave (azul = obrigatória, âmbar = desejável), quantos candidatos já foram associados, e botões para editar, abrir/fechar ou remover a vaga.',
    side: 'top',
    roles: OPERATORS,
  },
  {
    path: '/resumes',
    selector: '[data-tour="resumes-upload"]',
    title: '📄 Currículos',
    description:
      'Envie currículos em PDF ou DOCX aqui. A IA extrai as informações, sugere uma vaga compatível e calcula um placar de compatibilidade automaticamente.',
    side: 'bottom',
    roles: OPERATORS,
  },
  {
    path: '/resumes',
    selector: '[data-tour="resumes-sync"]',
    title: 'Sincronização por e-mail',
    description:
      'Currículos recebidos por e-mail entram automaticamente aqui a cada 15 minutos. Esse botão força uma sincronização manual, na hora.',
    side: 'bottom',
    roles: OPERATORS,
  },
  {
    path: '/resumes',
    selector: '[data-tour="resumes-filters"]',
    title: 'Filtros',
    description: 'Filtre a lista por classificação (Compatível, Parcial, Sem vaga compatível) ou por uma vaga específica.',
    side: 'bottom',
    roles: OPERATORS,
  },
  {
    path: '/resumes',
    selector: '[data-tour="resumes-table"]',
    title: 'Lista de currículos',
    description:
      'Cada linha mostra o candidato, a vaga sugerida, o placar da IA, a classificação e se o pré-cadastro já foi preenchido. Selecione várias linhas pra excluir em lote, ou clique em "Ver detalhe" pra abrir o currículo completo com a análise da IA e o perfil comportamental.',
    side: 'top',
    roles: OPERATORS,
  },
  {
    path: '/approved',
    selector: '[data-tour="approved-list"]',
    title: '✅ Aprovados',
    description:
      'Candidatos classificados como Compatíveis, agrupados por vaga. Aqui você entra em contato por e-mail/telefone, baixa o currículo original, ou devolve o candidato pro Banco de Talentos se ele não seguir no processo.',
    side: 'top',
    roles: OPERATORS,
  },
  {
    path: '/talent-pool',
    selector: '[data-tour="talentpool-reevaluate"]',
    title: '⭐ Banco de Talentos',
    description:
      'Candidatos sem vaga compatível no momento ficam aqui. Clique em "Reclassificar com IA" pra reavaliar todos de uma vez contra as vagas abertas — isso também acontece automaticamente sempre que uma vaga nova é cadastrada.',
    side: 'bottom',
    roles: OPERATORS,
  },
  {
    path: '/talent-pool',
    selector: '[data-tour="talentpool-table"]',
    title: 'Associar a uma vaga',
    description:
      'Quando a IA encontra uma vaga sugerida pro candidato, ela aparece como um chip verde clicável na coluna "Possíveis vagas" — clique nela (ou em "Associar a vaga") pra mover o candidato de volta pra Currículos.',
    side: 'top',
    roles: OPERATORS,
  },
  {
    path: '/users',
    selector: '[data-tour="users-new"]',
    title: '👥 Usuários',
    description:
      'Convide novos membros da equipe por e-mail e defina o perfil de acesso: Admin (acesso total), Recrutador (opera o processo, sem gerenciar e-mail) ou Visualizador (só consulta o Dashboard).',
    side: 'bottom',
    roles: OPERATORS,
  },
  {
    path: '/users',
    selector: '[data-tour="users-table"]',
    title: 'Gerenciar a equipe',
    description: 'Acompanhe quem já aceitou o convite, reenvie convites pendentes, redefina senhas ou remova acessos.',
    side: 'top',
    roles: OPERATORS,
  },
]
