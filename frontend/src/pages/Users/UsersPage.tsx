import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Trash2, X } from 'lucide-react'
import { api } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageLoader } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { useCurrentUser, UserRole } from '../../hooks/useCurrentUser'

type Role = 'ADMIN' | 'RECRUITER' | 'VIEWER'

interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
  inviteAccepted: boolean
  lastSignIn: string | null
}

const roleBadge: Record<Role, 'danger' | 'info' | 'neutral'> = {
  ADMIN: 'danger',
  RECRUITER: 'info',
  VIEWER: 'neutral',
}

const roleLabel: Record<Role, string> = {
  ADMIN: 'Admin',
  RECRUITER: 'Recrutador',
  VIEWER: 'Visualizador',
}

function getRoleOptions(currentRole: UserRole | undefined): Role[] {
  if (currentRole === 'ADMIN') return ['ADMIN', 'RECRUITER', 'VIEWER']
  return ['RECRUITER', 'VIEWER']
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const { role: currentRole } = useCurrentUser()

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('RECRUITER')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data.data),
  })

  const create = useMutation({
    mutationFn: () => api.post('/users', { name, email, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowForm(false)
      setName('')
      setEmail('')
      setRole('RECRUITER')
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmDelete(null)
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    create.mutate()
  }

  if (isLoading) return <PageLoader />

  const canCreate = currentRole === 'ADMIN' || currentRole === 'RECRUITER'
  const canDelete = currentRole === 'ADMIN'

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowForm((v) => !v)}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Novo usuário
          </Button>
        </div>
      )}

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Convidar usuário</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Nome"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="email@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Perfil</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white text-slate-900"
              >
                {getRoleOptions(currentRole).map((r) => (
                  <option key={r} value={r}>{roleLabel[r]}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={create.isPending}
              >
                Enviar convite
              </Button>
            </div>
          </form>
          {create.isError && (
            <p className="mt-2 text-sm text-red-600">
              {(create.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao criar usuário'}
            </p>
          )}
        </Card>
      )}

      {!users?.length ? (
        <EmptyState title="Nenhum usuário" description="Convide usuários usando o botão acima." />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-6 py-3 font-medium">Nome</th>
                  <th className="px-6 py-3 font-medium">E-mail</th>
                  <th className="px-6 py-3 font-medium">Perfil</th>
                  <th className="px-6 py-3 font-medium">Convite</th>
                  <th className="px-6 py-3 font-medium">Cadastrado em</th>
                  {canDelete && <th className="px-6 py-3 font-medium" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-6 py-3 text-slate-600">{u.email}</td>
                    <td className="px-6 py-3">
                      <Badge variant={roleBadge[u.role] ?? 'neutral'}>{roleLabel[u.role] ?? u.role}</Badge>
                    </td>
                    <td className="px-6 py-3">
                      {u.inviteAccepted ? (
                        <Badge variant="success">Aceito</Badge>
                      ) : (
                        <Badge variant="warning">Pendente</Badge>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    {canDelete && (
                      <td className="px-6 py-3 text-right">
                        {confirmDelete === u.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-xs text-slate-500">Confirmar?</span>
                            <Button
                              variant="danger"
                              size="sm"
                              loading={remove.isPending}
                              onClick={() => remove.mutate(u.id)}
                            >
                              Sim
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setConfirmDelete(null)}
                            >
                              Não
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(u.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            title="Remover usuário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
