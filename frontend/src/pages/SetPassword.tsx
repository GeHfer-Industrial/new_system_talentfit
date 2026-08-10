import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function SetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase processes the #access_token from the invite URL automatically.
    // We just wait for the session to be established.
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        toast.error('Link inválido ou expirado. Solicite um novo convite.')
        navigate('/login', { replace: true })
      } else {
        setReady(true)
      }
    })
  }, [navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      toast.error('As senhas não coincidem')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
      setSubmitting(false)
      return
    }
    toast.success('Senha criada com sucesso!')
    navigate('/dashboard', { replace: true })
  }

  if (!ready) return null

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <img src="/logo_principal.svg" alt="GEHFER" className="h-14 w-auto rounded-lg" />
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Criar sua senha</h2>
          <p className="text-slate-500 text-sm mb-6">Defina uma senha para acessar a plataforma</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nova senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirmar senha"
              type="password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" loading={submitting}>
              Salvar senha e entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
