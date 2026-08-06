import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'

export type CategoryCode = 'E' | 'C' | 'A' | 'V'
export type QuadrantCode = 'INSPIRACAO' | 'IMPULSO' | 'EXECUCAO' | 'ESTRATEGIA'

export interface BehavioralQuestion {
  order: number
  text: string
  alternatives: Record<CategoryCode, string>
}

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

export interface SubmitBehavioralAnswer {
  questionOrder: number
  categoryCode: CategoryCode
}

const unwrap = <T>(res: { data: { data: T } }) => res.data.data

export function useBehavioralQuestions() {
  return useQuery({
    queryKey: ['behavioral-profile', 'questions'],
    queryFn: () => api.get<{ data: BehavioralQuestion[] }>('/behavioral-profile/questions').then(unwrap),
    staleTime: Infinity,
  })
}

export function useBehavioralContent() {
  return useQuery({
    queryKey: ['behavioral-profile', 'content'],
    queryFn: () =>
      api
        .get<{ data: { profiles: ProfileContent[]; quadrants: QuadrantContent[] } }>('/behavioral-profile/content')
        .then(unwrap),
    staleTime: Infinity,
  })
}

export function useSubmitBehavioralResult() {
  return useMutation({
    mutationFn: (dto: { preRegistrationId: string; answers: SubmitBehavioralAnswer[] }) =>
      api.post('/behavioral-profile/results', dto),
  })
}
