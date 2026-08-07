import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'

export type EducationLevel = 'ENSINO_MEDIO' | 'TECNICO' | 'SUPERIOR' | 'POS_GRADUACAO' | 'MESTRADO' | 'DOUTORADO'
export type EducationStatus = 'EM_ANDAMENTO' | 'CONCLUIDO' | 'TRANCADO'
export type LanguageLevel = 'BASICO' | 'INTERMEDIARIO' | 'AVANCADO' | 'FLUENTE'

export interface WorkExperiencePayload {
  company: string
  role: string
  startDate: string
  endDate?: string
  current?: boolean
  description?: string
}

export interface EducationPayload {
  institution: string
  course: string
  level: EducationLevel
  status: EducationStatus
  startDate?: string
  endDate?: string
}

export interface LanguageSkillPayload {
  language: string
  level: LanguageLevel
}

export interface DigitalResumePayload {
  preRegistrationId: string
  skills: string[]
  experiences: WorkExperiencePayload[]
  educations: EducationPayload[]
  languages: LanguageSkillPayload[]
  desiredJobId?: string
}

export function useCreateDigitalResume() {
  return useMutation({
    mutationFn: (dto: DigitalResumePayload) => api.post('/digital-resume', dto),
  })
}
