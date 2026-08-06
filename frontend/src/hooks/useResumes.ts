import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export type Classification = 'COMPATIBLE' | 'PARTIAL' | 'TALENT_POOL'

export interface BehavioralAnswer {
  id: string
  questionOrder: number
  questionText: string
  answerText: string
  categoryCode: 'E' | 'C' | 'A' | 'V'
}

export interface BehavioralResult {
  id: string
  pointsE: number
  pointsC: number
  pointsA: number
  pointsV: number
  dominantProfile: 'E' | 'C' | 'A' | 'V'
  secondaryProfile: 'E' | 'C' | 'A' | 'V'
  pctInspiracao: number
  pctImpulso: number
  pctExecucao: number
  pctEstrategia: number
  createdAt: string
  answers: BehavioralAnswer[]
}

export interface PreRegistration {
  id: string
  name: string
  email: string
  birthPlace: string
  birthDate: string
  rg: string
  cpf: string
  fatherName: string
  motherName: string
  behavioralResult: BehavioralResult | null
}

export interface Resume {
  id: string
  candidateId: string
  jobId: string | null
  extractedText: string
  extractedSkills: string[]
  score: number
  classification: Classification
  classificationEngine: string
  aiSummary: string | null
  createdAt: string
  candidate: {
    id: string
    name: string
    email: string | null
    phone: string | null
    resumeFile: string | null
    preRegistration: PreRegistration | null
  }
  job: { id: string; title: string; department: string } | null
}

const unwrap = <T>(res: { data: { data: T } }) => res.data.data

export function useResumes(filters?: { classification?: Classification; jobId?: string }) {
  return useQuery({
    queryKey: ['resumes', filters],
    queryFn: () => api.get<{ data: Resume[] }>('/resumes', { params: filters }).then(unwrap),
    staleTime: 60 * 1000,
  })
}

export function useResume(id: string) {
  return useQuery({
    queryKey: ['resumes', id],
    queryFn: () => api.get<{ data: Resume }>(`/resumes/${id}`).then(unwrap),
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

export function useUploadResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.post<{ data: Resume }>('/resumes/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resumes'] }),
  })
}

export function useDeleteResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/resumes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resumes'] }),
  })
}

export function useUpdateClassification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, classification, jobId }: { id: string; classification: Classification; jobId?: string }) =>
      api.put(`/resumes/${id}/classification`, { classification, jobId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
    },
  })
}
