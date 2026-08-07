import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Download, Trash2, Mail, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useResume, useUpdateClassification, useDeleteResume, Classification } from '../../hooks/useResumes'
import { useJobs } from '../../hooks/useJobs'
import { ClassificationBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { PageLoader } from '../../components/ui/Spinner'
import { BehavioralProfileCard } from '../../components/features/candidates/BehavioralProfileCard'
import { DigitalResumeCard } from '../../components/features/candidates/DigitalResumeCard'

const ENGINE_LABELS: Record<string, { label: string; color: string }> = {
  groq: { label: 'Avaliado por IA (Groq)', color: 'bg-orange-50 text-orange-700 border border-orange-200' },
  keyword: { label: 'Avaliado por keywords', color: 'bg-slate-100 text-slate-500 border border-slate-200' },
}

function EngineBadge({ engine }: { engine: string }) {
  const meta = ENGINE_LABELS[engine] ?? ENGINE_LABELS.keyword
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${meta.color}`}>
      {meta.label}
    </span>
  )
}

function ScoreRing({ score }: { score: number }) {
  const radius = 36
  const circ = 2 * Math.PI * radius
  const offset = circ - (Math.min(score, 100) / 100) * circ
  const color = score >= 40 ? '#10B981' : score > 0 ? '#F59E0B' : '#94A3B8'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="8" />
        <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 48 48)" className="transition-all duration-500" />
      </svg>
      <span className="absolute text-xl font-bold text-slate-800">{Math.round(score)}</span>
    </div>
  )
}

function buildPreRegistrationMessage(candidateId: string) {
  const url = new URL('/pre-cadastro', window.location.origin)
  url.searchParams.set('candidateId', candidateId)
  return `Olá! Segue o link para você preencher seu pré-cadastro na Gehfer: ${url.toString()}`
}

function buildMailtoHref(email: string | null | undefined, message: string) {
  const subject = encodeURIComponent('Pré-cadastro Gehfer')
  const body = encodeURIComponent(message)
  return `mailto:${email ?? ''}?subject=${subject}&body=${body}`
}

function buildWhatsappHref(phone: string | null | undefined, message: string) {
  const digits = phone?.replace(/\D/g, '') ?? ''
  const withCountryCode = digits && !digits.startsWith('55') ? `55${digits}` : digits
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`
}

export default function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: resume, isLoading } = useResume(id!)
  const { data: jobs } = useJobs({ status: 'OPEN' })
  const updateClassification = useUpdateClassification()
  const deleteResume = useDeleteResume()
  const navigate = useNavigate()
  const [showText, setShowText] = useState(false)
  const [changeJobOpen, setChangeJobOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading) return <PageLoader />
  if (!resume) return <p className="text-slate-500">Currículo não encontrado.</p>

  const doDelete = async () => {
    await deleteResume.mutateAsync(resume.id)
    toast.success('Currículo excluído')
    navigate('/resumes')
  }

  const classify = async (classification: Classification, jobId?: string, actionKey?: string) => {
    setPendingAction(actionKey ?? classification)
    try {
      await updateClassification.mutateAsync({ id: resume.id, classification, jobId })
      toast.success('Classificação atualizada')
    } finally {
      setPendingAction(null)
    }
  }

  const preRegistration = resume.candidate.preRegistration

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/resumes" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Voltar para currículos
        </Link>
        <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} loading={deleteResume.isPending}>
          <Trash2 className="h-4 w-4" />
          Excluir currículo
        </Button>
      </div>

      <div
        className={`grid grid-cols-1 ${preRegistration ? 'lg:grid-cols-[1fr_380px]' : ''} gap-6 items-start print:grid-cols-1`}
      >
        <div className="space-y-6">
          <Card className="print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1">
                <h2 className="font-semibold text-slate-900 text-lg mb-2">{resume.candidate.name}</h2>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                  {resume.candidate.email && <span>📧 {resume.candidate.email}</span>}
                  {resume.candidate.phone && <span>📞 {resume.candidate.phone}</span>}
                  {resume.job && <span>💼 {resume.job.title} — {resume.job.department}</span>}
                </div>
              </div>

              <div className="flex items-center gap-4 sm:border-l sm:border-slate-100 sm:pl-6">
                <ScoreRing score={resume.score} />
                <div className="flex flex-col gap-1.5">
                  <ClassificationBadge classification={resume.classification} />
                  <EngineBadge engine={resume.classificationEngine} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                loading={updateClassification.isPending && pendingAction === 'COMPATIBLE'}
                disabled={updateClassification.isPending || deleteResume.isPending}
                onClick={() => classify('COMPATIBLE', resume.jobId ?? undefined)}
              >
                ✅ Aprovar
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={updateClassification.isPending && pendingAction === 'REJEITAR'}
                disabled={updateClassification.isPending || deleteResume.isPending}
                onClick={() => classify('TALENT_POOL', undefined, 'REJEITAR')}
              >
                ❌ Rejeitar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                loading={updateClassification.isPending && pendingAction === 'TALENT_POOL'}
                disabled={updateClassification.isPending || deleteResume.isPending}
                onClick={() => classify('TALENT_POOL')}
              >
                ⭐ Banco de Talentos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={updateClassification.isPending || deleteResume.isPending}
                onClick={() => setChangeJobOpen(true)}
              >
                🔁 Alterar vaga
              </Button>
            </div>
          </Card>

          <div className="columns-1 md:columns-2 gap-6 print:columns-none">
            {(resume.aiSummary || resume.extractedSkills.length > 0) && (
              <Card className="break-inside-avoid mb-6 print:hidden">
                {resume.aiSummary && (
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">🤖</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1 text-sm">Análise da IA</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{resume.aiSummary}</p>
                    </div>
                  </div>
                )}

                {resume.extractedSkills.length > 0 && (
                  <div className={resume.aiSummary ? 'mt-4 pt-4 border-t border-slate-100' : ''}>
                    <h3 className="font-semibold text-slate-900 mb-3 text-sm">
                      {resume.classification === 'TALENT_POOL' ? 'Competências do candidato' : 'Keywords encontradas'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {resume.extractedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            <Card className="break-inside-avoid mb-6 print:hidden">
              <h3 className="font-semibold text-slate-900 mb-3">Pré-cadastro</h3>
              {preRegistration ? (
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Naturalidade</dt>
                    <dd className="text-slate-700">{preRegistration.birthPlace}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Data de nascimento</dt>
                    <dd className="text-slate-700">
                      {new Date(preRegistration.birthDate).toLocaleDateString('pt-BR')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wide">RG</dt>
                    <dd className="text-slate-700">{preRegistration.rg}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wide">CPF</dt>
                    <dd className="text-slate-700">{preRegistration.cpf}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Nome do pai</dt>
                    <dd className="text-slate-700">{preRegistration.fatherName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wide">Nome da mãe</dt>
                    <dd className="text-slate-700">{preRegistration.motherName}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-slate-500">
                  Pré-cadastro ainda não enviado. Envie o link{' '}
                  <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">/pre-cadastro</span> para o
                  candidato preencher.
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                <a href={buildMailtoHref(resume.candidate.email, buildPreRegistrationMessage(resume.candidate.id))}>
                  <Button variant="secondary" size="sm">
                    <Mail className="h-4 w-4" />
                    Enviar por e-mail
                  </Button>
                </a>
                <a
                  href={buildWhatsappHref(resume.candidate.phone, buildPreRegistrationMessage(resume.candidate.id))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="secondary" size="sm">
                    <MessageCircle className="h-4 w-4" />
                    Enviar por WhatsApp
                  </Button>
                </a>
              </div>
            </Card>

            <Card className="break-inside-avoid mb-6 print:hidden">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowText(!showText)}
                  className="flex items-center gap-2 flex-1 text-left min-w-0"
                >
                  <h3 className="font-semibold text-slate-900 truncate">Texto extraído do currículo</h3>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${showText ? 'rotate-180' : ''}`}
                  />
                </button>
                {resume.candidate.resumeFile && (
                  <a
                    href={`${import.meta.env.VITE_API_URL}/files/${resume.candidate.resumeFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="shrink-0"
                  >
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                      Baixar original
                    </Button>
                  </a>
                )}
              </div>
              {showText && (
                <pre className="mt-4 text-xs text-slate-600 bg-slate-50 rounded-lg p-4 overflow-auto max-h-64 whitespace-pre-wrap">
                  {resume.extractedText}
                </pre>
              )}
            </Card>

            {preRegistration?.digitalResume && (
              <div className="break-inside-avoid mb-6">
                <DigitalResumeCard resume={preRegistration.digitalResume} />
              </div>
            )}
          </div>
        </div>

        {preRegistration && (
          preRegistration.behavioralResult ? (
            <BehavioralProfileCard result={preRegistration.behavioralResult} candidateName={resume.candidate.name} />
          ) : (
            <Card className="print:hidden">
              <h3 className="font-semibold text-slate-900 mb-2">Perfil Comportamental</h3>
              <p className="text-sm text-slate-500">Questionário de perfil comportamental ainda não concluído.</p>
            </Card>
          )
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={doDelete}
        loading={deleteResume.isPending}
        title="Excluir currículo"
        description="Deseja excluir este currículo? O arquivo também será removido. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
      />

      <Modal
        open={changeJobOpen}
        onClose={() => setChangeJobOpen(false)}
        title="Associar a uma vaga"
        footer={
          <>
            <Button variant="secondary" onClick={() => setChangeJobOpen(false)}>Cancelar</Button>
            <Button onClick={() => { classify('COMPATIBLE', selectedJobId); setChangeJobOpen(false) }} disabled={!selectedJobId}>
              Confirmar
            </Button>
          </>
        }
      >
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Selecione uma vaga</option>
          {jobs?.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
      </Modal>
    </div>
  )
}
