import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, Trash2, Users, UserX, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useExitInterviews,
  useDeleteExitInterview,
  useExitInterviewMeta,
  useExitInterviewStats,
} from '../../hooks/useExitInterviews'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { PageLoader } from '../../components/ui/Spinner'
import { StatCard } from '../../components/features/dashboard/StatCard'
import { DepartmentChart } from '../../components/features/dashboard/DepartmentChart'
import { QuestionBreakdownChart } from '../../components/features/exit-interviews/QuestionBreakdownChart'

type Tab = 'lista' | 'relatorio'

export default function ExitInterviewsPage() {
  const [tab, setTab] = useState<Tab>('lista')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)

  const { data: meta } = useExitInterviewMeta()
  const { data: interviews, isLoading } = useExitInterviews(
    departmentFilter ? { department: departmentFilter } : undefined,
  )
  const { data: stats, isLoading: loadingStats } = useExitInterviewStats(departmentFilter || undefined)
  const deleteInterview = useDeleteExitInterview()

  const doDelete = async () => {
    if (!confirmDelete) return
    await deleteInterview.mutateAsync(confirmDelete.id)
    toast.success('Entrevista removida')
    setConfirmDelete(null)
  }

  const departureLabel = (value: string) => meta?.departureTypes.find((o) => o.value === value)?.label ?? value

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-white">
            <button
              onClick={() => setTab('lista')}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                tab === 'lista' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setTab('relatorio')}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                tab === 'relatorio' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Relatório
            </button>
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todos os departamentos</option>
            {meta?.departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <Link to="/exit-interviews/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nova Entrevista
          </Button>
        </Link>
      </div>

      {tab === 'lista' ? (
        isLoading ? (
          <PageLoader />
        ) : !interviews?.length ? (
          <EmptyState
            title="Nenhuma entrevista registrada"
            description="Registre a primeira entrevista de desligamento para começar."
            action={
              <Link to="/exit-interviews/new">
                <Button>Nova Entrevista</Button>
              </Link>
            }
          />
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                    <th className="px-6 py-3 font-medium">Colaborador</th>
                    <th className="px-6 py-3 font-medium">Cargo</th>
                    <th className="px-6 py-3 font-medium">Departamento</th>
                    <th className="px-6 py-3 font-medium">Tipo</th>
                    <th className="px-6 py-3 font-medium">Data da entrevista</th>
                    <th className="px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interviews.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-900">{it.employeeName}</td>
                      <td className="px-6 py-3 text-slate-600">{it.position}</td>
                      <td className="px-6 py-3 text-slate-600">{it.department}</td>
                      <td className="px-6 py-3">
                        <Badge variant={it.departureType === 'DEMITIDO' ? 'danger' : 'warning'}>
                          {departureLabel(it.departureType)}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(it.interviewDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/exit-interviews/${it.id}`}
                            className="text-slate-400 hover:text-primary transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setConfirmDelete({ id: it.id, name: it.employeeName })}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : loadingStats ? (
        <PageLoader />
      ) : !stats?.total ? (
        <EmptyState title="Sem dados para o relatório" description="Registre entrevistas para ver os gráficos aqui." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={Users} label="Total de entrevistas" value={stats.total} />
            <StatCard
              icon={UserX}
              label="Demitidos"
              value={stats.departureType.find((d) => d.value === 'DEMITIDO')?.count ?? 0}
              color="text-red-500"
            />
            <StatCard
              icon={LogOut}
              label="Pediram demissão"
              value={stats.departureType.find((d) => d.value === 'PEDIU_DEMISSAO')?.count ?? 0}
              color="text-amber-500"
            />
          </div>

          {!departmentFilter && stats.byDepartment.length > 0 && (
            <Card>
              <h2 className="font-semibold text-slate-900 mb-4">Entrevistas por departamento</h2>
              <DepartmentChart data={stats.byDepartment} />
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {stats.dismissalReasons.some((r) => r.count > 0) && (
              <Card>
                <h2 className="font-semibold text-slate-900 mb-2">Motivos de demissão</h2>
                <QuestionBreakdownChart data={stats.dismissalReasons.map((r) => ({ label: r.label, count: r.count }))} />
              </Card>
            )}
            {stats.resignationReasons.some((r) => r.count > 0) && (
              <Card>
                <h2 className="font-semibold text-slate-900 mb-2">Motivos de pedido de demissão</h2>
                <QuestionBreakdownChart
                  data={stats.resignationReasons.map((r) => ({ label: r.label, count: r.count }))}
                />
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stats.questions.map((q) => (
              <Card key={q.key}>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">{q.label}</h3>
                <QuestionBreakdownChart data={q.breakdown.map((b) => ({ label: b.label, count: b.count }))} />
              </Card>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        loading={deleteInterview.isPending}
        title="Remover entrevista"
        description={`Deseja remover a entrevista de "${confirmDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
      />
    </div>
  )
}
