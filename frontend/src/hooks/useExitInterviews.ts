import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface Option {
  value: string
  label: string
}

export interface ScaleQuestion {
  key: string
  label: string
  options: Option[]
}

export interface ExitInterviewMeta {
  departments: string[]
  departureTypes: Option[]
  dismissalReasons: Option[]
  resignationReasons: Option[]
  questions: ScaleQuestion[]
}

export interface ExitInterview {
  id: string
  employeeName: string
  position: string
  department: string
  admissionDate: string
  terminationDate: string
  interviewDate: string
  interviewerName: string
  departureType: string
  dismissalReason: string | null
  dismissalReasonOther: string | null
  resignationReason: string | null
  resignationReasonOther: string | null
  toolsSupport: string
  healthyEnvironment: string
  teamRelationship: string
  leadershipRelationship: string
  receivedFeedback: string
  couldSuggestIdeas: string
  feltValued: string
  growthOpportunities: string
  clearProcedures: string
  healthSafety: string
  benefitsRating: string
  likedMost: string | null
  improvementSuggestions: string | null
  wouldRecommend: string | null
  finalComments: string | null
  createdAt: string
}

export type CreateExitInterviewDto = Omit<ExitInterview, 'id' | 'createdAt'>

export interface QuestionBreakdown {
  key: string
  label: string
  breakdown: { value: string; label: string; count: number }[]
}

export interface ExitInterviewStats {
  total: number
  byDepartment: { department: string; count: number }[]
  departureType: { value: string; label: string; count: number }[]
  dismissalReasons: { value: string; label: string; count: number }[]
  resignationReasons: { value: string; label: string; count: number }[]
  questions: QuestionBreakdown[]
}

const unwrap = <T>(res: { data: { data: T } }) => res.data.data

export function useExitInterviewMeta() {
  return useQuery({
    queryKey: ['exit-interviews', 'meta'],
    queryFn: () => api.get<{ data: ExitInterviewMeta }>('/exit-interviews/meta').then(unwrap),
    staleTime: 10 * 60 * 1000,
  })
}

export function useExitInterviews(filters?: { department?: string; departureType?: string }) {
  return useQuery({
    queryKey: ['exit-interviews', filters],
    queryFn: () => api.get<{ data: ExitInterview[] }>('/exit-interviews', { params: filters }).then(unwrap),
    staleTime: 60 * 1000,
  })
}

export function useExitInterview(id: string) {
  return useQuery({
    queryKey: ['exit-interviews', id],
    queryFn: () => api.get<{ data: ExitInterview }>(`/exit-interviews/${id}`).then(unwrap),
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

export function useExitInterviewStats(department?: string) {
  return useQuery({
    queryKey: ['exit-interviews', 'stats', department],
    queryFn: () =>
      api.get<{ data: ExitInterviewStats }>('/exit-interviews/stats', { params: { department } }).then(unwrap),
    staleTime: 60 * 1000,
  })
}

export function useCreateExitInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateExitInterviewDto) => api.post('/exit-interviews', dto).then((r) => r.data.data as ExitInterview),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exit-interviews'] }),
  })
}

export function useDeleteExitInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/exit-interviews/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exit-interviews'] }),
  })
}
