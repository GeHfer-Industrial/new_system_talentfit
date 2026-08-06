export type CategoryCode = 'E' | 'C' | 'A' | 'V'
export type QuadrantCode = 'INSPIRACAO' | 'IMPULSO' | 'EXECUCAO' | 'ESTRATEGIA'

export interface ProfileContent {
  code: CategoryCode
  name: string
  animalName: string
  brainRole: string
  tagline: string
  color: string
  mainCharacteristics: string
  behavioralTraits: string
  strengths: string
  improvementPoints: string
  motivations: string
  values: string
}

export interface QuadrantContent {
  code: QuadrantCode
  name: string
  brainRegion: 'Anterior' | 'Direito' | 'Posterior' | 'Esquerdo'
  categories: [CategoryCode, CategoryCode]
  keywords: string[]
  description: string
}

export interface QuestionAlternatives {
  E: string
  C: string
  A: string
  V: string
}

export interface Question {
  order: number
  text: string
  alternatives: QuestionAlternatives
}

export const PROFILES: Record<CategoryCode, ProfileContent> = {
  E: {
    code: 'E',
    name: 'Executor',
    animalName: 'Tubarão',
    brainRole: 'Ativador (Ação)',
    tagline: 'Fazer rápido (Atitude/ação)',
    color: '#E4572E',
    mainCharacteristics: 'Objetivo, decidido, gosta de desafios e de agir rápido.',
    behavioralTraits: 'Direto, competitivo, impaciente com burocracia, foca em resultado.',
    strengths: 'Senso de urgência, coragem para decidir, foco em metas.',
    improvementPoints: 'Pode ser visto como impositivo; precisa ouvir mais antes de agir; cuidar dos detalhes.',
    motivations: 'Metas desafiadoras, autonomia, resultados visíveis.',
    values: 'Conquista, eficiência, liberdade para agir.',
  },
  C: {
    code: 'C',
    name: 'Comunicador',
    animalName: 'Gato',
    brainRole: 'Comunicador',
    tagline: 'Fazer junto (Comunicação)',
    color: '#F3A712',
    mainCharacteristics: 'Sociável, entusiasmado, gosta de gente e de trabalhar em equipe.',
    behavioralTraits: 'Expressivo, otimista, persuasivo, sensível ao clima do grupo.',
    strengths: 'Engaja pessoas, constrói relações, comunica com facilidade.',
    improvementPoints: 'Pode perder foco em detalhes; evita conflito quando deveria enfrentar; precisa de mais disciplina com prazos.',
    motivations: 'Reconhecimento social, boas relações, ambiente positivo.',
    values: 'Conexão, colaboração, otimismo.',
  },
  A: {
    code: 'A',
    name: 'Analista',
    animalName: 'Lobo',
    brainRole: 'Organizador',
    tagline: 'Fazer certo (Análise)',
    color: '#2E86AB',
    mainCharacteristics: 'Detalhista, organizado, gosta de dados e de planejamento.',
    behavioralTraits: 'Cauteloso, metódico, exigente com qualidade, prefere previsibilidade.',
    strengths: 'Rigor técnico, planejamento, atenção a riscos e detalhes.',
    improvementPoints: 'Pode demorar para decidir; resiste a mudanças rápidas; precisa comunicar mais o raciocínio.',
    motivations: 'Qualidade, ordem, segurança nas decisões.',
    values: 'Precisão, consistência, responsabilidade.',
  },
  V: {
    code: 'V',
    name: 'Visionário',
    animalName: 'Águia',
    brainRole: 'Idealizador',
    tagline: 'Fazer diferente (Idealização)',
    color: '#6A4C93',
    mainCharacteristics: 'Criativo, curioso, gosta de ideias novas e de mudança.',
    behavioralTraits: 'Intuitivo, gosta de inovar, se entedia com rotina, pensa no futuro.',
    strengths: 'Criatividade, visão estratégica, provoca inovação.',
    improvementPoints: 'Pode perder o foco no presente; nem sempre detalha a execução; precisa de mais método.',
    motivations: 'Novidade, liberdade para criar, impacto de longo prazo.',
    values: 'Inovação, autonomia intelectual, visão de futuro.',
  },
}

export const QUADRANTS: Record<QuadrantCode, QuadrantContent> = {
  INSPIRACAO: {
    code: 'INSPIRACAO',
    name: 'Inspiração',
    brainRegion: 'Direito',
    categories: ['V', 'C'],
    keywords: [
      'Amplo',
      'Criativo',
      'Essência',
      'Colorido',
      'Receptivo',
      'Meditativo',
      'Artístico',
      'Aberto',
      'Aventureiro',
      'Novos caminhos',
      'Intuitivo',
      'Espacial',
      'Sintético',
    ],
    description:
      'Pensa em possibilidades e naturalmente envolve outras pessoas nelas; combina criatividade com comunicação; costuma liderar pelo entusiasmo e pela novidade.',
  },
  IMPULSO: {
    code: 'IMPULSO',
    name: 'Impulso',
    brainRegion: 'Posterior',
    categories: ['C', 'E'],
    keywords: [
      'Energético',
      'Sociável',
      'Mobilizador',
      'Direto',
      'Entusiasta',
      'Prático',
      'Persuasivo',
      'Impaciente',
      'Engajador',
      'Orientado à ação',
    ],
    description:
      'Mobiliza pessoas para agir rápido; combina energia social com foco em resultado; costuma ser o motor que tira ideias do papel com o time.',
  },
  EXECUCAO: {
    code: 'EXECUCAO',
    name: 'Execução',
    brainRegion: 'Esquerdo',
    categories: ['E', 'A'],
    keywords: [
      'Detalhista',
      'Mecânico',
      'Substância',
      'Preto/branco',
      'Cético',
      'Linguagem',
      'Lógico',
      'Fechado',
      'Cauteloso',
      'Repetitivo',
      'Verbal',
      'Memória',
      'Analítico',
    ],
    description:
      'Entrega com método; combina ação com organização; costuma ser quem transforma metas em plano e plano em resultado concreto.',
  },
  ESTRATEGIA: {
    code: 'ESTRATEGIA',
    name: 'Estratégia',
    brainRegion: 'Anterior',
    categories: ['A', 'V'],
    keywords: [
      'Estratégico',
      'Analítico',
      'Visionário',
      'Planejador',
      'Ponderado',
      'Antecipa cenários',
      'Rigoroso',
      'Curioso',
      'Perspicaz',
      'Projeta o futuro',
    ],
    description:
      'Planeja o futuro com base em dados e visão; combina rigor analítico com criatividade; costuma pensar em cenários antes de agir.',
  },
}

export const QUESTIONS: Question[] = [
  {
    order: 1,
    text: 'Eu sou...',
    alternatives: {
      V: 'Idealista, criativo e visionário',
      C: 'Divertido, espiritual e benéfico',
      A: 'Confiável, meticuloso e previsível',
      E: 'Focado, determinado e persistente',
    },
  },
  {
    order: 2,
    text: 'Eu gosto de...',
    alternatives: {
      E: 'Ser piloto',
      C: 'Conversar com os passageiros',
      A: 'Planejar a viagem',
      V: 'Explorar novas rotas',
    },
  },
  {
    order: 3,
    text: 'Se você quiser se dar bem comigo...',
    alternatives: {
      V: 'Me dê liberdade',
      A: 'Me deixe saber sua expectativa',
      E: 'Lidere, siga ou saia do caminho',
      C: 'Seja amigável, carinhoso e compreensivo',
    },
  },
  {
    order: 4,
    text: 'Para conseguir obter bons resultados é preciso...',
    alternatives: {
      V: 'Ter incertezas',
      A: 'Controlar o essencial',
      C: 'Diversão e cerebração',
      E: 'Planejar e obter recursos',
    },
  },
  {
    order: 5,
    text: 'Eu me divirto quando...',
    alternatives: {
      E: 'Estou me exercitando',
      V: 'Tenho novidades',
      C: 'Estou com outros',
      A: 'Determino as regras',
    },
  },
  {
    order: 6,
    text: 'Eu penso que...',
    alternatives: {
      C: 'Unidos venceremos, divididos perderemos',
      E: 'O ataque é melhor que a defesa',
      V: 'É bom ser manso, mas andar com um porrete',
      A: 'Um homem prevenido vale por dois',
    },
  },
  {
    order: 7,
    text: 'Minha preocupação é...',
    alternatives: {
      V: 'Gerar a idéia global',
      C: 'Fazer com que as pessoas gostem',
      A: 'Fazer com que funcione',
      E: 'Fazer com que aconteça',
    },
  },
  {
    order: 8,
    text: 'Eu prefiro...',
    alternatives: {
      V: 'Perguntas a respostas',
      A: 'Ter todos os detalhes',
      E: 'Vantagens a meu favor',
      C: 'Que todos tenham a chance de ser ouvido',
    },
  },
  {
    order: 9,
    text: 'Eu gosto de...',
    alternatives: {
      E: 'Fazer progresso',
      C: 'Construir memórias',
      A: 'Fazer sentido',
      V: 'Tornar as pessoas confortáveis',
    },
  },
  {
    order: 10,
    text: 'Eu gosto de chegar...',
    alternatives: {
      E: 'Na frente',
      C: 'Junto',
      A: 'Na hora',
      V: 'Em outro lugar',
    },
  },
  {
    order: 11,
    text: 'Um ótimo dia para mim é quando...',
    alternatives: {
      E: 'Consigo fazer muitas coisas',
      C: 'Me divirto com meus amigos',
      A: 'Tudo segue conforme planejado',
      V: 'Desfruto de coisas novas e estimulantes',
    },
  },
  {
    order: 12,
    text: 'Eu vejo a morte como...',
    alternatives: {
      V: 'Uma grande aventura misteriosa',
      C: 'Oportunidade para rever os falecidos',
      A: 'Um modo de receber recompensas',
      E: 'Algo que sempre chega muito cedo',
    },
  },
  {
    order: 13,
    text: 'Minha filosofia de vida é...',
    alternatives: {
      E: 'Há ganhadores e perdedores, e eu acredito ser um ganhador',
      C: 'Para eu ganhar, ninguém precisa perder',
      A: 'Para ganhar é preciso seguir as regras',
      V: 'Para ganhar, é necessário inventar novas regras',
    },
  },
  {
    order: 14,
    text: 'Eu sempre gostei de...',
    alternatives: {
      V: 'Explorar',
      A: 'Evitar surpresas',
      E: 'Focalizar a meta',
      C: 'Realizar uma abordagem natural',
    },
  },
  {
    order: 15,
    text: 'Eu gosto de mudanças se...',
    alternatives: {
      E: 'Me der uma vantagem competitiva',
      C: 'For divertido e puder ser compartilhado',
      V: 'Me der mais liberdade e variedade',
      A: 'Melhorar ou me der mais controle',
    },
  },
  {
    order: 16,
    text: 'Não existe nada de errado em...',
    alternatives: {
      E: 'Se colocar na frente',
      C: 'Colocar os outros na frente',
      V: 'Mudar de idéia',
      A: 'Ser consistente',
    },
  },
  {
    order: 17,
    text: 'Eu gosto de buscar conselhos de...',
    alternatives: {
      E: 'Pessoas bem sucedidas',
      C: 'Anciões e conselheiros',
      A: 'Autoridades no assunto',
      V: 'Lugares, os mais estranhos',
    },
  },
  {
    order: 18,
    text: 'Meu lema é...',
    alternatives: {
      V: 'Fazer o que precisa ser feito',
      A: 'Fazer bem feito',
      C: 'Fazer junto com o grupo',
      E: 'Simplesmente fazer',
    },
  },
  {
    order: 19,
    text: 'Eu gosto de...',
    alternatives: {
      V: 'Complexidade, mesmo se confuso',
      A: 'Ordem e sistematização',
      C: 'Calor humano e animação',
      E: 'Coisas claras e simples',
    },
  },
  {
    order: 20,
    text: 'Tempo para mim é...',
    alternatives: {
      E: 'Algo que detesto dispendiçar',
      C: 'Um grande ciclo',
      A: 'Uma flecha que leva ao inevitável',
      V: 'Irrelevante',
    },
  },
  {
    order: 21,
    text: 'Se eu fosse bibliônario...',
    alternatives: {
      C: 'Faria doações para muitas entidades',
      A: 'Criaria uma poupança avantajada',
      V: 'Faria o que desse na cabeça',
      E: 'Exibiria bastante com algumas pessoas',
    },
  },
  {
    order: 22,
    text: 'Eu acredito que...',
    alternatives: {
      E: 'O destino é mais importante que a jornada',
      C: 'A jornada é mais importante que o destino',
      A: 'Um centavo economizado é um centavo ganho',
      V: 'Bastam um navio e uma estrela para navegar',
    },
  },
  {
    order: 23,
    text: 'Eu acredito também que...',
    alternatives: {
      E: 'Aquele que hesita está perdido',
      A: 'De grão em grão a galinha enche o papo',
      C: 'O que vai, volta',
      V: 'Um sorriso ou uma careta é o mesmo para quem é cego',
    },
  },
  {
    order: 24,
    text: 'Eu acredito ainda que...',
    alternatives: {
      A: 'É melhor prudência do que arrependimento',
      V: 'A autoridade deve ser desafiada',
      E: 'Ganhar é fundamental',
      C: 'O coletivo é mais importante do que o individual',
    },
  },
  {
    order: 25,
    text: 'Eu penso que...',
    alternatives: {
      V: 'Não é fácil ficar encurralado',
      A: 'É preferível olhar, antes de pular',
      C: 'Duas cabeças pensam melhor do que uma',
      E: 'Se você não tem condições de competir, não compita',
    },
  },
]
