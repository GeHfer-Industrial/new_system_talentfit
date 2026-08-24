import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Download, Trash2, RefreshCw, Loader2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useResumes, Classification, useUploadResume, useDeleteResume } from '../../hooks/useResumes'
import { useJobs } from '../../hooks/useJobs'
import { api } from '../../lib/api'
import { Badge, ClassificationBadge } from '../../components/ui/Badge'
import { ScoreBadge } from '../../components/features/candidates/ScoreBadge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

function PreRegistrationStatusBadge({ preRegistration }: { preRegistration: { behavioralResult: unknown } | null }) {
  if (!preRegistration) return <Badge variant="neutral">Não enviado</Badge>
  if (!preRegistration.behavioralResult) return <Badge variant="warning">Incompleto</Badge>
  return <Badge variant="success">Completo</Badge>
}

export default function ResumesPage() {
  const [classification, setClassification] = useState<Classification | ''>('')
  const [jobId, setJobId] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<{ id: string; name: string } | null>(null)
  const [editName, setEditName] = useState('')
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadResume = useUploadResume()
  const deleteResume = useDeleteResume()

  const syncEmails = useMutation({
    mutationFn: () => api.post('/email/sync'),
    onSuccess: (res) => {
      const processed = res.data.data?.processed ?? 0
      qc.invalidateQueries({ queryKey: ['resumes'] })
      toast.success(processed > 0 ? `${processed} e-mail(s) sincronizados` : 'Nenhum e-mail novo encontrado')
    },
    onError: (err) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao sincronizar'
      toast.error(msg)
    },
  })

  const doDelete = async () => {
    if (!confirmDelete) return
    await deleteResume.mutateAsync(confirmDelete)
    toast.success('Currículo excluído')
    setConfirmDelete(null)
  }

  const reEvaluateOne = useMutation({
    mutationFn: (resumeId: string) => api.post(`/resumes/${resumeId}/reclassify`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
      const classification = res.data?.data?.classification
      if (classification && classification !== 'TALENT_POOL') {
        toast.success('Candidato reclassificado — agora compatível com uma vaga!')
      } else {
        toast.success('Candidato reclassificado pela IA')
      }
    },
    onError: (err) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao reclassificar'
      toast.error(msg)
    },
  })

  const reEvaluateAll = useMutation({
    mutationFn: () => api.post('/resumes/reclassify-pending'),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
      const { processed, nowCompatible, rateLimited } = res.data?.data ?? {}
      if (rateLimited) {
        toast(
          `${processed ?? 0} reclassificado(s) — limite de uso da IA atingido, aguarde um pouco e clique em "Avaliar todos" novamente para continuar.`,
          { icon: '⏳', duration: 6000 },
        )
      } else if (nowCompatible > 0) {
        toast.success(`${processed} reclassificados — ${nowCompatible} agora compatíveis com vagas!`)
      } else {
        toast.success(`${processed ?? 0} currículo(s) reclassificado(s)`)
      }
    },
    onError: (err) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao reclassificar'
      toast.error(msg)
    },
  })

  const updateCandidateName = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.put(`/candidates/${id}`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('Nome atualizado')
      setEditingCandidate(null)
    },
    onError: (err) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao atualizar nome'
      toast.error(msg)
    },
  })

  const openEditName = (id: string, name: string) => {
    setEditingCandidate({ id, name })
    setEditName(name)
  }

  const saveEditName = () => {
    if (!editingCandidate || !editName.trim()) return
    updateCandidateName.mutate({ id: editingCandidate.id, name: editName.trim() })
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = (ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id))
      return allSelected ? new Set() : new Set(ids)
    })
  }

  const doBulkDelete = async () => {
    setBulkDeleting(true)
    try {
      const ids = Array.from(selectedIds)
      await Promise.all(ids.map((id) => deleteResume.mutateAsync(id)))
      toast.success(`${ids.length} currículo${ids.length > 1 ? 's' : ''} excluído${ids.length > 1 ? 's' : ''}`)
      setSelectedIds(new Set())
      setConfirmBulkDelete(false)
    } catch {
      toast.error('Erro ao excluir alguns currículos')
    } finally {
      setBulkDeleting(false)
    }
  }

  const { data: resumes, isLoading, isFetching } = useResumes({
    approvalStatus: 'PENDING',
    classification: classification || undefined,
    jobId: jobId || undefined,
  })
  const { data: jobs } = useJobs()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (fileRef.current) fileRef.current.value = ''

    if (files.length === 1) {
      const toastId = toast.loading('IA avaliando currículo...')
      try {
        const res = await uploadResume.mutateAsync(files[0])
        const classification = res.data?.data?.classification
        if (classification === 'COMPATIBLE') {
          toast.success('Candidato compatível com uma vaga!', { id: toastId })
        } else if (classification === 'PARTIAL') {
          toast.success('Candidato parcialmente compatível com uma vaga', { id: toastId })
        } else {
          toast('Candidato sem vaga compatível — adicionado ao Banco de Talentos', { id: toastId, icon: '⭐' })
        }
      } catch {
        toast.error('Erro ao processar currículo', { id: toastId })
      }
      return
    }

    const toastId = toast.loading(`Processando 1 de ${files.length} currículos...`)
    let compatible = 0, partial = 0, talentPool = 0, errors = 0

    for (let i = 0; i < files.length; i++) {
      toast.loading(`IA avaliando ${i + 1} de ${files.length}: ${files[i].name}`, { id: toastId })
      try {
        const res = await uploadResume.mutateAsync(files[i])
        const c = res.data?.data?.classification
        if (c === 'COMPATIBLE') compatible++
        else if (c === 'PARTIAL') partial++
        else talentPool++
      } catch {
        errors++
      }
    }

    const parts = []
    if (compatible) parts.push(`${compatible} compatível${compatible > 1 ? 'is' : ''}`)
    if (partial) parts.push(`${partial} parcial${partial > 1 ? 'is' : ''}`)
    if (talentPool) parts.push(`${talentPool} no banco de talentos`)
    if (errors) parts.push(`${errors} com erro`)

    toast.success(`${files.length} currículos processados — ${parts.join(', ')}`, { id: toastId, duration: 5000 })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap" data-tour="resumes-filters">
          <select
            value={classification}
            onChange={(e) => setClassification(e.target.value as Classification | '')}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todas as classificações</option>
            <option value="COMPATIBLE">Compatível</option>
            <option value="PARTIAL">Parcial</option>
            <option value="TALENT_POOL">Sem vaga compatível</option>
          </select>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todas as vagas</option>
            {jobs?.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="danger" onClick={() => setConfirmBulkDelete(true)}>
              <Trash2 className="h-4 w-4" />
              Excluir selecionados ({selectedIds.size})
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => reEvaluateAll.mutate()}
            loading={reEvaluateAll.isPending}
            title="Reavalia com IA todos os candidatos sem vaga compatível"
          >
            <RefreshCw className="h-4 w-4" />
            Avaliar todos
          </Button>
          <Button
            variant="secondary"
            onClick={() => syncEmails.mutate()}
            loading={syncEmails.isPending}
            title="Buscar novos currículos por e-mail"
            data-tour="resumes-sync"
          >
            <RefreshCw className="h-4 w-4" />
            Sincronizar e-mails
          </Button>
          <input ref={fileRef} type="file" accept=".pdf,.docx" multiple className="hidden" onChange={handleUpload} />
          <Button onClick={() => fileRef.current?.click()} loading={uploadResume.isPending} data-tour="resumes-upload">
            <Upload className="h-4 w-4" />
            Enviar currículo(s)
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        </Card>
      ) : !resumes?.length ? (
        <EmptyState title="Nenhum currículo encontrado" description="Envie um PDF ou DOCX para iniciar a triagem." />
      ) : (
        <Card padding="none" data-tour="resumes-table">
          <div className={`overflow-x-auto transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-6 py-3 font-medium w-10">
                    <input
                      type="checkbox"
                      checked={resumes.length > 0 && resumes.every((r) => selectedIds.has(r.id))}
                      onChange={() => toggleSelectAll(resumes.map((r) => r.id))}
                      className="rounded border-slate-300"
                      aria-label="Selecionar todos"
                    />
                  </th>
                  <th className="px-6 py-3 font-medium">Candidato</th>
                  <th className="px-6 py-3 font-medium">Vaga</th>
                  <th className="px-6 py-3 font-medium">Score</th>
                  <th className="px-6 py-3 font-medium">Classificação</th>
                  <th className="px-6 py-3 font-medium">Pré-cadastro</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resumes.map((r) => (
                  <tr key={r.id} className={`hover:bg-slate-50 ${selectedIds.has(r.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelected(r.id)}
                        className="rounded border-slate-300"
                        aria-label={`Selecionar ${r.candidate.name}`}
                      />
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        {r.candidate.name}
                        <button
                          onClick={() => openEditName(r.candidate.id, r.candidate.name)}
                          className="text-slate-300 hover:text-primary transition-colors"
                          title="Editar nome"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{r.job?.title ?? <span className="text-slate-400">—</span>}</td>
                    <td className="px-6 py-3"><ScoreBadge score={r.score} /></td>
                    <td className="px-6 py-3"><ClassificationBadge classification={r.classification} /></td>
                    <td className="px-6 py-3">
                      <PreRegistrationStatusBadge preRegistration={r.candidate.preRegistration} />
                    </td>
                    <td className="px-6 py-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Link to={`/resumes/${r.id}`} className="text-primary text-xs font-medium hover:underline">
                          Ver detalhe
                        </Link>
                        {r.candidate.resumeFile && (
                          <a
                            href={`${import.meta.env.VITE_API_URL}/files/${r.candidate.resumeFile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="text-slate-400 hover:text-slate-600"
                            title="Baixar currículo"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                        {r.classification === 'TALENT_POOL' && (
                          <button
                            onClick={() => reEvaluateOne.mutate(r.id)}
                            disabled={reEvaluateOne.isPending && reEvaluateOne.variables === r.id}
                            className="text-slate-400 hover:text-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Reclassificar com IA"
                          >
                            {reEvaluateOne.isPending && reEvaluateOne.variables === r.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <RefreshCw className="h-4 w-4" />
                            }
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDelete(r.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Excluir currículo"
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
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        loading={deleteResume.isPending}
        title="Excluir currículo"
        description="Deseja excluir este currículo? O arquivo também será removido. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
      />

      <ConfirmModal
        open={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={doBulkDelete}
        loading={bulkDeleting}
        title="Excluir currículos selecionados"
        description={`Deseja excluir ${selectedIds.size} currículo${selectedIds.size > 1 ? 's' : ''}? Os arquivos também serão removidos. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />

      <Modal
        open={!!editingCandidate}
        onClose={() => setEditingCandidate(null)}
        title="Editar nome do candidato"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingCandidate(null)}>Cancelar</Button>
            <Button onClick={saveEditName} loading={updateCandidateName.isPending} disabled={!editName.trim()}>
              Salvar
            </Button>
          </>
        }
      >
        <Input
          label="Nome"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          autoFocus
        />
      </Modal>
    </div>
  )
}
