import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useExitInterview, useExitInterviewMeta, useDeleteExitInterview } from '../../hooks/useExitInterviews'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { PageLoader } from '../../components/ui/Spinner'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400 uppercase tracking-wide">{label}</dt>
      <dd className="text-slate-700 text-sm">{value || '—'}</dd>
    </div>
  )
}

export default function ExitInterviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: interview, isLoading } = useExitInterview(id!)
  const { data: meta } = useExitInterviewMeta()
  const deleteInterview = useDeleteExitInterview()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading || !meta) return <PageLoader />
  if (!interview) return <p className="text-slate-500">Entrevista não encontrada.</p>

  const optionLabel = (options: { value: string; label: string }[], value: string | null) =>
    options.find((o) => o.value === value)?.label ?? value ?? '—'

  const doDelete = async () => {
    await deleteInterview.mutateAsync(interview.id)
    toast.success('Entrevista removida')
    navigate('/exit-interviews')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link to="/exit-interviews" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Voltar para entrevistas
        </Link>
        <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-4 w-4" />
          Remover entrevista
        </Button>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-semibold text-slate-900 text-lg">{interview.employeeName}</h2>
            <p className="text-sm text-slate-500">{interview.position} — {interview.department}</p>
          </div>
          <Badge variant={interview.departureType === 'DEMITIDO' ? 'danger' : 'warning'}>
            {optionLabel(meta.departureTypes, interview.departureType)}
          </Badge>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Admissão" value={new Date(interview.admissionDate).toLocaleDateString('pt-BR')} />
          <Field label="Demissão" value={new Date(interview.terminationDate).toLocaleDateString('pt-BR')} />
          <Field label="Entrevista" value={new Date(interview.interviewDate).toLocaleDateString('pt-BR')} />
          <Field label="Entrevistador(a)" value={interview.interviewerName} />
        </dl>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-3">Motivo de desligamento</h3>
        {interview.departureType === 'DEMITIDO' ? (
          <dl className="space-y-3">
            <Field label="Motivo da demissão" value={optionLabel(meta.dismissalReasons, interview.dismissalReason)} />
            {interview.dismissalReason === 'OUTROS' && (
              <Field label="Especificação" value={interview.dismissalReasonOther ?? ''} />
            )}
          </dl>
        ) : (
          <dl className="space-y-3">
            <Field label="Motivo do pedido de demissão" value={optionLabel(meta.resignationReasons, interview.resignationReason)} />
            {interview.resignationReason === 'OUTROS' && (
              <Field label="Especificação" value={interview.resignationReasonOther ?? ''} />
            )}
          </dl>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-3">Clima e experiência na empresa</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {meta.questions.map((q) => (
            <Field
              key={q.key}
              label={q.label}
              value={optionLabel(q.options, interview[q.key as keyof typeof interview] as string)}
            />
          ))}
        </dl>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 mb-3">Perguntas abertas</h3>
        <dl className="space-y-4">
          <Field label="O que mais gostava na empresa" value={interview.likedMost ?? ''} />
          <Field label="O que poderia ser melhorado" value={interview.improvementSuggestions ?? ''} />
          <Field label="Recomendaria a empresa" value={interview.wouldRecommend ?? ''} />
          <Field label="Comentário final" value={interview.finalComments ?? ''} />
        </dl>
      </Card>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={doDelete}
        loading={deleteInterview.isPending}
        title="Remover entrevista"
        description={`Deseja remover a entrevista de "${interview.employeeName}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
      />
    </div>
  )
}
