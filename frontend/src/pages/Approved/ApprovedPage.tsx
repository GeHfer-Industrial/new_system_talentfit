import { useMemo, useState } from 'react'
import { Download, Mail, Phone, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useResumes, useUpdateClassification } from '../../hooks/useResumes'
import { ScoreBadge } from '../../components/features/candidates/ScoreBadge'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 bg-slate-200 rounded" />
        <div className="h-3 w-64 bg-slate-100 rounded" />
      </div>
      <div className="h-6 w-14 bg-slate-200 rounded-full" />
      <div className="h-4 w-20 bg-slate-100 rounded" />
    </div>
  )
}

export default function ApprovedPage() {
  const { data: resumes, isLoading } = useResumes({ approvalStatus: 'APPROVED' })
  const updateClassification = useUpdateClassification()
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null)

  const grouped = useMemo(() => {
    if (!resumes) return []
    const map = new Map<string, { jobTitle: string; department: string; items: typeof resumes }>()

    for (const r of resumes) {
      const key = r.job?.id ?? '__no_job__'
      const label = r.job?.title ?? 'Sem vaga definida'
      const dept = r.job?.department ?? ''
      if (!map.has(key)) map.set(key, { jobTitle: label, department: dept, items: [] })
      map.get(key)!.items.push(r)
    }

    return Array.from(map.values()).sort((a, b) =>
      a.jobTitle === 'Sem vaga definida' ? 1 : a.jobTitle.localeCompare(b.jobTitle),
    )
  }, [resumes])

  const doRemove = () => {
    if (!confirmRemove) return
    updateClassification.mutate(
      { id: confirmRemove.id, classification: 'TALENT_POOL' },
      { onSuccess: () => { toast.success('Candidato movido para o Banco de Talentos'); setConfirmRemove(null) } },
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-4 w-56 bg-slate-200 animate-pulse rounded" />
        {Array.from({ length: 2 }).map((_, i) => (
          <section key={i} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-40 bg-slate-200 animate-pulse rounded" />
              <div className="h-3 w-24 bg-slate-100 animate-pulse rounded" />
            </div>
            <Card padding="none">
              <div className="divide-y divide-slate-100">
                {Array.from({ length: 3 }).map((_, j) => <SkeletonRow key={j} />)}
              </div>
            </Card>
          </section>
        ))}
      </div>
    )
  }

  if (!resumes?.length) {
    return (
      <EmptyState
        title="Nenhum candidato aprovado ainda"
        description="Aprove currículos na aba Currículos para que apareçam aqui."
      />
    )
  }

  return (
    <div className="space-y-8" data-tour="approved-list">
      <p className="text-sm text-slate-500">
        {resumes.length} candidato{resumes.length !== 1 ? 's' : ''} aprovado{resumes.length !== 1 ? 's' : ''} em {grouped.length} vaga{grouped.length !== 1 ? 's' : ''}
      </p>

      {grouped.map((group) => (
        <section key={group.jobTitle}>
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="font-semibold text-slate-900">{group.jobTitle}</h2>
            {group.department && (
              <span className="text-xs text-slate-500">{group.department}</span>
            )}
            <span className="ml-auto text-xs text-slate-400">
              {group.items.length} candidato{group.items.length !== 1 ? 's' : ''}
            </span>
          </div>

          <Card padding="none">
            <div className="divide-y divide-slate-100">
              {group.items.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{r.candidate.name}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {r.candidate.email && (
                        <a
                          href={`mailto:${r.candidate.email}`}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors"
                        >
                          <Mail className="h-3 w-3" />
                          {r.candidate.email}
                        </a>
                      )}
                      {r.candidate.phone && (
                        <a
                          href={`tel:${r.candidate.phone}`}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          {r.candidate.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  <ScoreBadge score={r.score} />

                  {r.candidate.resumeFile && (
                    <a
                      href={`${import.meta.env.VITE_API_URL}/files/${r.candidate.resumeFile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline shrink-0"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar CV
                    </a>
                  )}

                  <button
                    onClick={() => setConfirmRemove({ id: r.id, name: r.candidate.name })}
                    disabled={updateClassification.isPending && updateClassification.variables?.id === r.id}
                    className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    title="Remover dos aprovados"
                  >
                    {updateClassification.isPending && updateClassification.variables?.id === r.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />
                    }
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </section>
      ))}

      <ConfirmModal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={doRemove}
        loading={updateClassification.isPending}
        title="Remover dos aprovados"
        description={`Deseja remover "${confirmRemove?.name}" dos aprovados? O candidato será movido para o Banco de Talentos.`}
        confirmLabel="Remover"
        variant="warning"
      />
    </div>
  )
}
