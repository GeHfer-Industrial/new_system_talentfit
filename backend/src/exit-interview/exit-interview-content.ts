export interface Option {
  value: string;
  label: string;
}

export const DEPARTMENTS: string[] = [
  'Financeiro',
  'Contábil / Fiscal',
  'Comercial',
  'Tecnologia da Informação',
  'Recursos Humanos',
  'Limpeza',
  'Operações I',
  'Operações II',
  'Operações III',
  'Expedição I',
  'Expedição II',
  'Expedição III',
  'Solda / Montagem I',
  'Solda / Montagem II',
  'Solda / Montagem III',
  'Logistica Administrativa',
  'Compras / Recebimento',
  'Almoxarifado',
  'Logistica Transportes',
  'Portaria',
  'Diretoria',
  'Manutenção',
];

export const DEPARTURE_TYPES: Option[] = [
  { value: 'DEMITIDO', label: 'Demitido' },
  { value: 'PEDIU_DEMISSAO', label: 'Pediu Demissão' },
];

export const DISMISSAL_REASONS: Option[] = [
  { value: 'BAIXO_DESEMPENHO', label: 'Baixo desempenho' },
  { value: 'PROBLEMAS_COMPORTAMENTAIS', label: 'Problemas comportamentais' },
  { value: 'NAO_SEGUE_NORMAS', label: 'Não segue normas e procedimentos' },
  { value: 'REDUCAO_EQUIPE', label: 'Redução de equipe / Custo' },
  { value: 'ASSIDUIDADE_PONTUALIDADE', label: 'Assiduidade/Pontualidade' },
  { value: 'OUTROS', label: 'Outros' },
];

export const RESIGNATION_REASONS: Option[] = [
  { value: 'MOTIVOS_PESSOAIS', label: 'Motivos pessoais' },
  { value: 'NOVA_OPORTUNIDADE', label: 'Nova oportunidade profissional' },
  { value: 'PROBLEMAS_LIDERANCA', label: 'Problemas com liderança' },
  { value: 'FALTA_RECONHECIMENTO', label: 'Falta de reconhecimento profissional' },
  { value: 'OUTROS', label: 'Outros' },
];

export const FREQUENCY_SCALE: Option[] = [
  { value: 'SEMPRE', label: 'Sempre' },
  { value: 'AS_VEZES', label: 'Às vezes' },
  { value: 'RARAMENTE', label: 'Raramente' },
  { value: 'NUNCA', label: 'Nunca' },
];

export const QUALITY_SCALE: Option[] = [
  { value: 'EXCELENTE', label: 'Excelente' },
  { value: 'BOM', label: 'Bom' },
  { value: 'REGULAR', label: 'Regular' },
  { value: 'RUIM', label: 'Ruim' },
];

export const YES_NO_SCALE: Option[] = [
  { value: 'SIM', label: 'Sim' },
  { value: 'OCASIONALMENTE', label: 'Ocasionalmente' },
  { value: 'NAO', label: 'Não' },
];

const optionValues = (options: Option[]) => options.map((o) => o.value);

export const DEPARTURE_TYPE_VALUES = optionValues(DEPARTURE_TYPES);
export const DISMISSAL_REASON_VALUES = optionValues(DISMISSAL_REASONS);
export const RESIGNATION_REASON_VALUES = optionValues(RESIGNATION_REASONS);
export const FREQUENCY_SCALE_VALUES = optionValues(FREQUENCY_SCALE);
export const QUALITY_SCALE_VALUES = optionValues(QUALITY_SCALE);
export const YES_NO_SCALE_VALUES = optionValues(YES_NO_SCALE);

export const SCALE_QUESTIONS: Array<{
  key:
    | 'toolsSupport'
    | 'healthyEnvironment'
    | 'teamRelationship'
    | 'leadershipRelationship'
    | 'receivedFeedback'
    | 'couldSuggestIdeas'
    | 'feltValued'
    | 'growthOpportunities'
    | 'clearProcedures'
    | 'healthSafety'
    | 'benefitsRating';
  label: string;
  options: Option[];
}> = [
  { key: 'toolsSupport', label: 'Ferramentas e suporte necessários', options: FREQUENCY_SCALE },
  { key: 'healthyEnvironment', label: 'Ambiente de trabalho saudável e colaborativo', options: FREQUENCY_SCALE },
  { key: 'teamRelationship', label: 'Relacionamento com a equipe e outros departamentos', options: QUALITY_SCALE },
  { key: 'leadershipRelationship', label: 'Relacionamento com a liderança direta', options: QUALITY_SCALE },
  { key: 'receivedFeedback', label: 'Feedbacks frequentes e construtivos', options: YES_NO_SCALE },
  { key: 'couldSuggestIdeas', label: 'Possibilidade de propor ideias e sugestões', options: YES_NO_SCALE },
  { key: 'feltValued', label: 'Sentia-se valorizado(a) pela empresa', options: YES_NO_SCALE },
  { key: 'growthOpportunities', label: 'Oportunidades de crescimento e desenvolvimento', options: YES_NO_SCALE },
  { key: 'clearProcedures', label: 'Normas e procedimentos claros e bem definidos', options: YES_NO_SCALE },
  { key: 'healthSafety', label: 'EPIs e orientações de Saúde e Segurança do Trabalho', options: YES_NO_SCALE },
  { key: 'benefitsRating', label: 'Avaliação dos benefícios da empresa', options: QUALITY_SCALE },
];
