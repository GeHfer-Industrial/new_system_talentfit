import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

const unwrap = <T>(res: { data: { data: T } }) => res.data.data

export interface PreRegistrationPayload {
  candidateId: string
  name: string
  email: string
  birthPlace: string
  birthDate: string
  rg: string
  cpf: string
  fatherName: string
  motherName: string
}

export interface PreRegistrationResult extends PreRegistrationPayload {
  id: string
}

export function useCreatePreRegistration() {
  return useMutation({
    mutationFn: (dto: PreRegistrationPayload) =>
      api.post<{ data: PreRegistrationResult }>('/pre-registration', dto),
  })
}

export function usePreRegistrationStatus(candidateId: string) {
  return useQuery({
    queryKey: ['pre-registration', 'status', candidateId],
    queryFn: () =>
      api.get<{ data: { completed: boolean } }>(`/pre-registration/status/${candidateId}`).then(unwrap),
    enabled: !!candidateId,
  })
}
