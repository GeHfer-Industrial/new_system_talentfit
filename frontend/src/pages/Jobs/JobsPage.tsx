import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ToggleLeft, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { useJobs, useToggleJobStatus, useDeleteJob } from '../../hooks/useJobs'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null)
  const { data: jobs, isLoading, isFetching } = useJobs(statusFilter ? { status: statusFilter as 'OPEN' | 'CLOSED' } : undefined)
  const toggleStatus = useToggleJobStatus()
  const deleteJob = useDeleteJob()

  const handleToggle = async (id: string, title: string) => {
    await toggleStatus.mutateAsync(id)
    toast.success(`Status de "${title}" alterado`)
  }

  const doDelete = async () => {
    if (!confirmDelete) return
    await deleteJob.mutateAsync(confirmDelete.id)
    toast.success('Vaga removida')
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2" data-tour="jobs-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          >
            <option value="">Todas as vagas</option>
            <option value="OPEN">Abertas</option>
            <option value="CLOSED">Fechadas</option>
          </select>
        </div>
        <Link to="/jobs/new" data-tour="jobs-new">
          <Button>
            <Plus className="h-4 w-4" />
            Nova Vaga
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !jobs?.length ? (
        <EmptyState
          title="Nenhuma vaga cadastrada"
          description="Crie a primeira vaga para começar a triagem."
          action={<Link to="/jobs/new"><Button>Nova Vaga</Button></Link>}
        />
      ) : (
        <div
          data-tour="jobs-grid"
          className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}
        >
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{job.title}</h3>
                  <p className="text-sm text-slate-500">{job.department}</p>
                </div>
                <Badge variant={job.status === 'OPEN' ? 'success' : 'neutral'}>
                  {job.status === 'OPEN' ? 'Aberta' : 'Fechada'}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
              <div className="flex flex-wrap gap-1">
                {job.keywords.slice(0, 4).map((k) => (
                  <span
                    key={k.id}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      k.type === 'REQUIRED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {k.keyword}
                  </span>
                ))}
                {job.keywords.length > 4 && (
                  <span className="text-xs text-slate-400">+{job.keywords.length - 4}</span>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">{job._count?.resumes ?? 0} candidato(s)</span>
                <div className="flex gap-2">
                  <Link to={`/jobs/${job.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={toggleStatus.isPending && toggleStatus.variables === job.id}
                    onClick={() => handleToggle(job.id, job.title)}
                  >
                    <ToggleLeft className="h-4 w-4" />
                    {job.status === 'OPEN' ? 'Fechar' : 'Abrir'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deleteJob.isPending && deleteJob.variables === job.id}
                    onClick={() => setConfirmDelete({ id: job.id, title: job.title })}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        loading={deleteJob.isPending}
        title="Remover vaga"
        description={`Deseja remover a vaga "${confirmDelete?.title}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
      />
    </div>
  )
}
