import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCreateExitInterview, useExitInterviewMeta } from '../../hooks/useExitInterviews'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { PageLoader } from '../../components/ui/Spinner'

const emptyForm = {
  employeeName: '',
  position: '',
  department: '',
  admissionDate: '',
  terminationDate: '',
  interviewDate: '',
  interviewerName: '',
  departureType: '',
  dismissalReason: '',
  dismissalReasonOther: '',
  resignationReason: '',
  resignationReasonOther: '',
  toolsSupport: '',
  healthyEnvironment: '',
  teamRelationship: '',
  leadershipRelationship: '',
  receivedFeedback: '',
  couldSuggestIdeas: '',
  feltValued: '',
  growthOpportunities: '',
  clearProcedures: '',
  healthSafety: '',
  benefitsRating: '',
  likedMost: '',
  improvementSuggestions: '',
  wouldRecommend: '',
  finalComments: '',
}

function Select({
  label,
  value,
  onChange,
  options,
  required = true,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
      >
        <option value="">Selecione</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function NewExitInterviewPage() {
  const navigate = useNavigate()
  const { data: meta, isLoading } = useExitInterviewMeta()
  const createInterview = useCreateExitInterview()
  const [form, setForm] = useState(emptyForm)

  const set = (field: keyof typeof emptyForm, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  if (isLoading || !meta) return <PageLoader />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const dto = {
      ...form,
      dismissalReason: form.departureType === 'DEMITIDO' ? form.dismissalReason : null,
      dismissalReasonOther: form.departureType === 'DEMITIDO' && form.dismissalReason === 'OUTROS' ? form.dismissalReasonOther : null,
      resignationReason: form.departureType === 'PEDIU_DEMISSAO' ? form.resignationReason : null,
      resignationReasonOther:
        form.departureType === 'PEDIU_DEMISSAO' && form.resignationReason === 'OUTROS' ? form.resignationReasonOther : null,
      likedMost: form.likedMost || null,
      improvementSuggestions: form.improvementSuggestions || null,
      wouldRecommend: form.wouldRecommend || null,
      finalComments: form.finalComments || null,
    }

    try {
      await createInterview.mutateAsync(dto)
      toast.success('Entrevista de desligamento registrada')
      navigate('/exit-interviews')
    } catch (err) {
      const e2 = err as { response?: { data?: { message?: string } } }
      toast.error(e2?.response?.data?.message ?? 'Erro ao registrar entrevista')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <Card>
        <h2 className="font-semibold text-slate-900 mb-4">Dados do colaborador</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nome" value={form.employeeName} onChange={(e) => set('employeeName', e.target.value)} required />
          <Input label="Cargo" value={form.position} onChange={(e) => set('position', e.target.value)} required />
          <Select
            label="Departamento"
            value={form.department}
            onChange={(v) => set('department', v)}
            options={meta.departments.map((d) => ({ value: d, label: d }))}
          />
          <Input
            label="Nome do(a) entrevistador(a)"
            value={form.interviewerName}
            onChange={(e) => set('interviewerName', e.target.value)}
            required
          />
          <Input
            label="Data de admissão"
            type="date"
            value={form.admissionDate}
            onChange={(e) => set('admissionDate', e.target.value)}
            required
          />
          <Input
            label="Data de demissão"
            type="date"
            value={form.terminationDate}
            onChange={(e) => set('terminationDate', e.target.value)}
            required
          />
          <Input
            label="Data da entrevista de desligamento"
            type="date"
            value={form.interviewDate}
            onChange={(e) => set('interviewDate', e.target.value)}
            required
          />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900 mb-4">Motivo de desligamento</h2>
        <div className="space-y-4">
          <Select
            label="O colaborador foi:"
            value={form.departureType}
            onChange={(v) => set('departureType', v)}
            options={meta.departureTypes}
          />

          {form.departureType === 'DEMITIDO' && (
            <>
              <Select
                label="Qual foi o motivo da demissão?"
                value={form.dismissalReason}
                onChange={(v) => set('dismissalReason', v)}
                options={meta.dismissalReasons}
              />
              {form.dismissalReason === 'OUTROS' && (
                <Input
                  label="Especifique"
                  value={form.dismissalReasonOther}
                  onChange={(e) => set('dismissalReasonOther', e.target.value)}
                  required
                />
              )}
            </>
          )}

          {form.departureType === 'PEDIU_DEMISSAO' && (
            <>
              <Select
                label="Qual foi o motivo de pedir demissão?"
                value={form.resignationReason}
                onChange={(v) => set('resignationReason', v)}
                options={meta.resignationReasons}
              />
              {form.resignationReason === 'OUTROS' && (
                <Input
                  label="Especifique"
                  value={form.resignationReasonOther}
                  onChange={(e) => set('resignationReasonOther', e.target.value)}
                  required
                />
              )}
            </>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900 mb-4">Clima e experiência na empresa</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {meta.questions.map((q) => (
            <Select
              key={q.key}
              label={q.label}
              value={form[q.key as keyof typeof emptyForm]}
              onChange={(v) => set(q.key as keyof typeof emptyForm, v)}
              options={q.options}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900 mb-4">Perguntas abertas</h2>
        <div className="space-y-4">
          {[
            { key: 'likedMost' as const, label: 'O que você mais gostava na empresa?' },
            { key: 'improvementSuggestions' as const, label: 'O que você acredita que poderia ser melhorado?' },
            { key: 'wouldRecommend' as const, label: 'Você recomendaria a empresa a um amigo para trabalhar? Por quê?' },
            { key: 'finalComments' as const, label: 'Gostaria de deixar alguma sugestão ou comentário final?' },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">{label}</label>
              <textarea
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                rows={3}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate('/exit-interviews')}>
          Cancelar
        </Button>
        <Button type="submit" loading={createInterview.isPending}>
          Salvar entrevista
        </Button>
      </div>
    </form>
  )
}
