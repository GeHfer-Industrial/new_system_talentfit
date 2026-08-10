import { useState, useEffect, useRef, FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

function useNextSyncCountdown() {
  const calcSeconds = () => {
    const now = new Date()
    const ms = (now.getMinutes() * 60 + now.getSeconds()) * 1000 + now.getMilliseconds()
    const interval = 15 * 60 * 1000
    return Math.ceil((interval - (ms % interval)) / 1000)
  }

  const [seconds, setSeconds] = useState(calcSeconds)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    ref.current = setInterval(() => setSeconds(calcSeconds()), 1000)
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [])

  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function EmailConfigPage() {
  const qc = useQueryClient()
  const { data: config } = useQuery({
    queryKey: ['email-config'],
    queryFn: () => api.get('/email/config').then((r) => r.data.data),
  })

  const [form, setForm] = useState({
    host: '',
    port: 993,
    user: '',
    password: '',
    protocol: 'IMAP',
    active: true,
    subjectFilter: 'curriculo',
    smtpHost: '',
    smtpPort: 587,
    sendAutoReply: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const countdown = useNextSyncCountdown()

  useEffect(() => {
    if (config) {
      setForm((prev) => ({
        ...prev,
        ...config,
        smtpHost: config.smtpHost ?? prev.smtpHost,
        smtpPort: config.smtpPort ?? prev.smtpPort,
        sendAutoReply: config.sendAutoReply ?? prev.sendAutoReply,
      }))
    }
  }, [config])

  const backendError = (err: unknown) => {
    const e = err as { response?: { data?: { message?: string } } }
    return e?.response?.data?.message ?? 'Erro desconhecido'
  }

  const save = useMutation({
    mutationFn: (data: typeof form) => api.post('/email/config', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['email-config'] }); toast.success('Configuração salva') },
    onError: (err) => toast.error('Erro ao salvar: ' + backendError(err)),
  })

  const test = useMutation({
    mutationFn: () => api.get('/email/test'),
    onSuccess: (res) => {
      const { connected, error } = res.data.data
      if (connected) {
        toast.success('Conexão bem-sucedida!')
      } else {
        toast.error(error ?? 'Falha na conexão — verifique as configurações')
      }
    },
    onError: (err) => toast.error('Erro ao testar: ' + backendError(err)),
  })

  const testSmtp = useMutation({
    mutationFn: () => api.get('/email/test-smtp'),
    onSuccess: (res) => {
      const { connected, error } = res.data.data
      if (connected) {
        toast.success('Conexão SMTP bem-sucedida!')
      } else {
        toast.error(error ?? 'Falha na conexão SMTP — verifique as configurações')
      }
    },
    onError: (err) => toast.error('Erro ao testar SMTP: ' + backendError(err)),
  })

  const sync = useMutation({
    mutationFn: () => api.post('/email/sync'),
    onSuccess: (res) => {
      const processed = res.data.data?.processed ?? 0
      toast.success(processed > 0 ? `${processed} e-mail(s) processados` : 'Nenhum e-mail novo encontrado')
    },
    onError: (err) => toast.error('Erro ao sincronizar: ' + backendError(err)),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const { host, port, user, password, protocol, active, subjectFilter, smtpHost, smtpPort, sendAutoReply } = form
    save.mutate({
      host,
      port,
      user,
      password,
      protocol,
      active,
      subjectFilter: subjectFilter ?? '',
      smtpHost: smtpHost ?? '',
      smtpPort,
      sendAutoReply,
    })
  }

  const set = (field: string, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <Card>
        <h2 className="font-semibold text-slate-900 mb-4">Configuração IMAP</h2>
        <div className="space-y-4">
          <Input label="Host IMAP" placeholder="imap.gmail.com" value={form.host} onChange={(e) => set('host', e.target.value)} />
          <Input label="Porta" type="number" value={form.port} onChange={(e) => set('port', Number(e.target.value))} />
          <Input label="Usuário" type="email" placeholder="rh@empresa.com" value={form.user} onChange={(e) => set('user', e.target.value)} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {config?.hasPassword && (
              <p className="text-xs text-slate-400">Já existe uma senha salva — deixe em branco para mantê-la.</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Protocolo</label>
            <select
              value={form.protocol}
              onChange={(e) => set('protocol', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
            >
              <option value="IMAP">IMAP</option>
              <option value="GMAIL">Gmail API</option>
              <option value="GRAPH">Microsoft Graph</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Filtro de assunto</label>
            <input
              type="text"
              placeholder="curriculo (deixe vazio para processar todos)"
              value={form.subjectFilter}
              onChange={(e) => set('subjectFilter', e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-slate-400">Só processa e-mails cujo assunto contenha este texto (sem distinção de maiúsculas ou acentos)</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set('active', e.target.checked)}
              className="rounded border-slate-300"
            />
            Sincronização ativa (a cada 15 min)
            {form.active && (
              <span className="ml-1 font-mono text-xs text-slate-400">— próxima em {countdown}</span>
            )}
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-900 mb-4">Resposta automática (SMTP)</h2>
        <p className="text-xs text-slate-400 mb-4">
          Ao salvar um currículo recebido por e-mail, responde automaticamente ao remetente com o link do
          pré-cadastro. Usa o mesmo usuário/senha configurados acima — só a porta/host de envio costumam ser
          diferentes do IMAP (ex: Gmail usa <span className="font-mono">smtp.gmail.com</span> pra enviar).
        </p>
        <div className="space-y-4">
          <Input
            label="Host SMTP"
            placeholder="smtp.gmail.com"
            value={form.smtpHost}
            onChange={(e) => set('smtpHost', e.target.value)}
          />
          <Input
            label="Porta SMTP"
            type="number"
            value={form.smtpPort}
            onChange={(e) => set('smtpPort', Number(e.target.value))}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.sendAutoReply}
              onChange={(e) => set('sendAutoReply', e.target.checked)}
              className="rounded border-slate-300"
            />
            Enviar link de pré-cadastro automaticamente
          </label>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={save.isPending}>Salvar configuração</Button>
        <Button type="button" variant="secondary" onClick={() => test.mutate()} loading={test.isPending}>
          Testar conexão IMAP
        </Button>
        <Button type="button" variant="secondary" onClick={() => testSmtp.mutate()} loading={testSmtp.isPending}>
          Testar conexão SMTP
        </Button>
        <Button type="button" variant="ghost" onClick={() => sync.mutate()} loading={sync.isPending}>
          Sincronizar agora
        </Button>
      </div>
    </form>
  )
}
