import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { PageLoader } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'

export default function UsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data.data),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-4">
      {!users?.length ? (
        <EmptyState title="Nenhum usuário" description="Adicione usuários no Supabase Auth." />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-6 py-3 font-medium">Nome</th>
                  <th className="px-6 py-3 font-medium">E-mail</th>
                  <th className="px-6 py-3 font-medium">Perfil</th>
                  <th className="px-6 py-3 font-medium">Cadastrado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u: { id: string; name: string; email: string; role: string; createdAt: string }) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-6 py-3 text-slate-600">{u.email}</td>
                    <td className="px-6 py-3">
                      <Badge variant={u.role === 'ADMIN' ? 'danger' : 'info'}>{u.role}</Badge>
                    </td>
                    <td className="px-6 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
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
