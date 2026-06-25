import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface Candidate {
  id: string
  name: string
  email: string | null
  phone: string | null
  createdAt: string
  resumes: Array<{ score: number; classification: string }>
  talentPool: { id: string } | null
}

const unwrap = <T>(res: { data: { data: T } }) => res.data.data

export function useCandidates(search?: string) {
  return useQuery({
    queryKey: ['candidates', search],
    queryFn: () => api.get<{ data: Candidate[] }>('/candidates', { params: { search } }).then(unwrap),
  })
}
