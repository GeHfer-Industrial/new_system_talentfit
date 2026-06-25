import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface DashboardStats {
  totalResumes: number
  openJobs: number
  classifiedToday: number
  talentPoolTotal: number
  byDepartment: { department: string; count: number }[]
}

export interface RecentResume {
  id: string
  score: number
  classification: string
  createdAt: string
  candidate: { name: string }
  job: { title: string; department: string } | null
}

const unwrap = <T>(res: { data: { data: T } }) => res.data.data

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get<{ data: DashboardStats }>('/dashboard/stats').then(unwrap),
    staleTime: 30 * 1000,
  })
}

export function useRecentResumes() {
  return useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: () => api.get<{ data: RecentResume[] }>('/dashboard/recent-resumes').then(unwrap),
    staleTime: 30 * 1000,
  })
}
