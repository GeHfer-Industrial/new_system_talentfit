import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Trash2, RefreshCw, Loader2, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../lib/api'
import { reclassifyWaitMs, DEFAULT_RECLASSIFY_WAIT_MS } from '../../lib/groqPacing'
import { useJobs } from '../../hooks/useJobs'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { PageLoader } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ScoreBadge } from '../../components/features/candidates/ScoreBadge'

interface SuggestedJob { id: string; title: string; department: string }
interface PoolEntry {
  id: string
  addedAt: string
  suggestedJobs: SuggestedJob[]
  candidate: {
    id: string
    name: string
    email: string | null
    resumeFile: string | null
    resumes: Array<{ extractedSkills: string[]; aiSummary: string | null; score: number }>
  }
}

export default function TalentPoolPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterJobId, setFilterJobId] = useState('')
  const [associateOpen, setAssociateOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState('')
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [reEvaluateAllProgress, setReEvaluateAllProgress] = useState<{ current: number; total: number } | null>(null)

  const { data: pool, isLoading } = useQuery({
    queryKey: ['talent-pool', search, filterJobId],
    queryFn: () =>
      api
        .get('/talent-pool', { params: { search: search || undefined, jobId: filterJobId || undefined } })
        .then((r) => r.data.data),
  })

  const { data: jobs } = useJobs({ status: 'OPEN' })

  const runReEvaluateAll = async () => {
    const entries = (pool as PoolEntry[] | undefined) ?? []
    if (!entries.length) {
      toast('Banco de talentos vazio', { icon: 'ℹ️' })
      return
    }

    let processed = 0
    let nowCompatible = 0
    let rateLimited = false

    for (let i = 0; i < entries.length; i++) {
      setReEvaluateAllProgress({ current: i + 1, total: entries.length })
      let waitMs = DEFAULT_RECLASSIFY_WAIT_MS
      try {
        const res = await api.post(`/talent-pool/re-evaluate/${entries[i].candidate.id}`)
        processed++
        waitMs = reclassifyWaitMs(res.data?.data?.tokensUsed)
        if (res.data?.data?.classification && res.data.data.classification !== 'TALENT_POOL') nowCompatible++
      } catch (err) {
        if ((err as { response?: { status?: number } })?.response?.status === 429) {
          rateLimited = true
          break
        }
      }
      qc.invalidateQueries({ queryKey: ['talent-pool'] })
      qc.invalidateQueries({ queryKey: ['resumes'] })
      if (i < entries.length - 1) await new Promise((resolve) => setTimeout(resolve, waitMs))
    }

    setReEvaluateAllProgress(null)

    if (rateLimited) {
      toast(
        `${processed} de ${entries.length} reclassificado(s) — limite de uso da IA atingido, aguarde um pouco e clique novamente para continuar.`,
        { icon: '⏳', duration: 6000 },
      )
    } else if (nowCompatible > 0) {
      toast.success(`${processed} reclassificados — ${nowCompatible} agora compatíveis com vagas!`)
    } else {
      toast.success(`${processed} currículos reclassificados`)
    }
  }

  const associate = useMutation({
    mutationFn: ({ candidateId, jobId }: { candidateId: string; jobId: string }) =>
      api.patch(`/talent-pool/${candidateId}`, { jobId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['talent-pool'] })
      qc.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('Candidato associado à vaga e movido para Currículos')
    },
  })

  const remove = useMutation({
    mutationFn: (candidateId: string) => api.delete(`/talent-pool/${candidateId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['talent-pool'] })
      toast.success('Candidato removido do banco de talentos')
    },
  })

  const reEvaluateOne = useMutation({
    mutationFn: (candidateId: string) => api.post(`/talent-pool/re-evaluate/${candidateId}`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['talent-pool'] })
      qc.invalidateQueries({ queryKey: ['resumes'] })
      const { classification } = res.data.data
      if (classification !== 'TALENT_POOL') {
        toast.success('Candidato reclassificado — agora compatível com uma vaga!')
      } else {
        toast.success('Candidato reclassificado pela IA')
      }
    },
    onError: (err) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao reclassificar candidato'
      toast.error(msg)
    },
  })

  const doRemove = () => {
    if (!confirmRemove) return
    remove.mutate(confirmRemove, { onSuccess: () => setConfirmRemove(null) })
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar candidato ou competência..."
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/30 w-64"
          />
        </div>

        <select
          value={filterJobId}
          onChange={(e) => setFilterJobId(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Filtrar por vaga compatível</option>
          {jobs?.map((j) => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>

        <Button
          variant="secondary"
          size="sm"
          loading={!!reEvaluateAllProgress}
          onClick={runReEvaluateAll}
          title="Reclassifica, um por um, todos os candidatos com IA usando as vagas abertas atuais"
          data-tour="talentpool-reevaluate"
        >
          <RefreshCw className="h-4 w-4" />
          {reEvaluateAllProgress ? `Reclassificando ${reEvaluateAllProgress.current}/${reEvaluateAllProgress.total}...` : 'Reclassificar com IA'}
        </Button>
      </div>

      {!pool?.length ? (
        <EmptyState
          title={filterJobId ? 'Nenhum candidato compatível com essa vaga' : 'Banco de talentos vazio'}
          description={filterJobId ? 'Tente outro filtro ou remova o filtro de vaga.' : 'Candidatos sem vaga compatível aparecem aqui.'}
        />
      ) : (
        <Card padding="none" data-tour="talentpool-table">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-6 py-3 font-medium">Candidato</th>
                  <th className="px-6 py-3 font-medium">E-mail</th>
                  <th className="px-6 py-3 font-medium">Score</th>
                  <th className="px-6 py-3 font-medium">Competências</th>
                  <th className="px-6 py-3 font-medium">Possíveis vagas</th>
                  <th className="px-6 py-3 font-medium">Adicionado em</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(pool as PoolEntry[]).map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 align-top">
                    <td className="px-6 py-3 font-medium text-slate-900">{entry.candidate.name}</td>
                    <td className="px-6 py-3 text-slate-500">{entry.candidate.email ?? '—'}</td>
                    <td className="px-6 py-3">
                      <ScoreBadge score={entry.candidate.resumes[0]?.score ?? 0} />
                    </td>
                    <td className="px-6 py-3 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {entry.candidate.resumes[0]?.extractedSkills.slice(0, 6).map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{s}</span>
                        ))}
                      </div>
                      {entry.candidate.resumes[0]?.aiSummary && (
                        <p className="mt-1.5 text-xs text-slate-400 italic leading-relaxed">
                          🤖 {entry.candidate.resumes[0].aiSummary}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3 max-w-xs">
                      {entry.suggestedJobs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {entry.suggestedJobs.map((j) => (
                            <button
                              key={j.id}
                              onClick={() => {
                                setSelectedCandidate(entry.candidate.id)
                                setSelectedJobId(j.id)
                                setAssociateOpen(true)
                              }}
                              className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium hover:bg-emerald-100 transition-colors"
                              title={`Associar a ${j.title}`}
                            >
                              {j.title}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Nenhuma vaga no momento</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{new Date(entry.addedAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => { setSelectedCandidate(entry.candidate.id); setSelectedJobId(''); setAssociateOpen(true) }}
                        >
                          Associar a vaga
                        </Button>
                        {entry.candidate.resumeFile && (
                          <a
                            href={`${import.meta.env.VITE_API_URL}/files/${entry.candidate.resumeFile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="text-slate-400 hover:text-primary transition-colors"
                            title="Baixar currículo"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => reEvaluateOne.mutate(entry.candidate.id)}
                          disabled={reEvaluateOne.isPending && reEvaluateOne.variables === entry.candidate.id}
                          className="text-slate-400 hover:text-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Reclassificar com IA"
                        >
                          {reEvaluateOne.isPending && reEvaluateOne.variables === entry.candidate.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <RefreshCw className="h-4 w-4" />
                          }
                        </button>
                        <button
                          onClick={() => setConfirmRemove(entry.candidate.id)}
                          disabled={remove.isPending && remove.variables === entry.candidate.id}
                          className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Remover do banco de talentos"
                        >
                          {remove.isPending && remove.variables === entry.candidate.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmModal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={doRemove}
        loading={remove.isPending}
        title="Remover do banco de talentos"
        description="Deseja remover este candidato do banco de talentos? Esta ação não pode ser desfeita."
        confirmLabel="Remover"
      />

      <Modal
        open={associateOpen}
        onClose={() => setAssociateOpen(false)}
        title="Associar a uma vaga"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssociateOpen(false)}>Cancelar</Button>
            <Button
              disabled={!selectedJobId}
              onClick={() => {
                if (selectedCandidate && selectedJobId) {
                  associate.mutate({ candidateId: selectedCandidate, jobId: selectedJobId })
                  setAssociateOpen(false)
                }
              }}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
        >
          <option value="">Selecione uma vaga</option>
          {jobs?.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
      </Modal>
    </div>
  )
}
