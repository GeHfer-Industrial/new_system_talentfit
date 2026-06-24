import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCreateJob } from '../../hooks/useJobs'
import { KeywordInput, Keyword } from '../../components/features/jobs/KeywordInput'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

const departments = ['Tecnologia', 'Marketing', 'Financeiro', 'RH', 'Operações', 'Comercial', 'Jurídico']

export default function NewJobPage() {
  const navigate = useNavigate()
  const createJob = useCreateJob()
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [description, setDescription] = useState('')
  const [keywords, setKeywords] = useState<Keyword[]>([])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await createJob.mutateAsync({ title, department, description, keywords })
    toast.success('Vaga criada com sucesso!')
    navigate('/jobs')
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <h2 className="font-semibold text-slate-900 mb-4">Informações da vaga</h2>
        <div className="space-y-4">
          <Input
            label="Título da vaga"
            placeholder="Ex: Desenvolvedor Backend Sênior"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Departamento</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            >
              <option value="">Selecione um departamento</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="Descreva as responsabilidades e requisitos da vaga..."
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900 mb-4">Palavras-chave para triagem</h2>
        <KeywordInput value={keywords} onChange={setKeywords} />
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate('/jobs')}>
          Cancelar
        </Button>
        <Button type="submit" loading={createJob.isPending}>
          Salvar vaga
        </Button>
      </div>
    </form>
  )
}
