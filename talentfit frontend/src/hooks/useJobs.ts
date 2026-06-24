import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface JobKeyword {
  id: string
  keyword: string
  type: 'REQUIRED' | 'DESIRED'
}

export interface Job {
  id: string
  title: string
  department: string
  description: string
  status: 'OPEN' | 'CLOSED'
  keywords: JobKeyword[]
  _count?: { resumes: number }
  createdAt: string
}

export interface CreateJobDto {
  title: string
  department: string
  description: string
  keywords?: { keyword: string; type: 'REQUIRED' | 'DESIRED' }[]
}

const unwrap = <T>(res: { data: { data: T } }) => res.data.data

export function useJobs(filters?: { status?: string; department?: string }) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api.get<{ data: Job[] }>('/jobs', { params: filters }).then(unwrap),
    staleTime: 2 * 60 * 1000,
  })
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => api.get<{ data: Job }>(`/jobs/${id}`).then(unwrap),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateJobDto) => api.post('/jobs', dto).then((r) => r.data.data as Job),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useUpdateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateJobDto> }) =>
      api.put(`/jobs/${id}`, dto).then((r) => r.data.data as Job),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['jobs', id] })
    },
  })
}

export function useToggleJobStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/jobs/${id}/toggle-status`).then((r) => r.data.data as Job),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useDeleteJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/jobs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
}
