import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from './useAuth'

export type UserRole = 'ADMIN' | 'RECRUITER' | 'VIEWER'

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export function useCurrentUser() {
  const { session } = useAuth()

  const { data: currentUser, isLoading } = useQuery<CurrentUser>({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data.data),
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  })

  return { currentUser, isLoading, role: currentUser?.role }
}
