import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'

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
