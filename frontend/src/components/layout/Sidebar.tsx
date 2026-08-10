import { useState, FormEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Star,
  CheckCircle2,
  Mail,
  Users,
  LogOut,
  KeyRound,
  HelpCircle,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useCurrentUser, UserRole } from '../../hooks/useCurrentUser'
import { useOnboardingTour } from '../../hooks/useOnboardingTour'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  roles: UserRole[]
}

const links: NavItem[] = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',         roles: ['ADMIN', 'RECRUITER', 'VIEWER'] },
  { to: '/jobs',         icon: Briefcase,        label: 'Vagas',             roles: ['ADMIN', 'RECRUITER'] },
  { to: '/resumes',      icon: FileText,         label: 'Currículos',        roles: ['ADMIN', 'RECRUITER'] },
  { to: '/approved',     icon: CheckCircle2,     label: 'Aprovados',         roles: ['ADMIN', 'RECRUITER'] },
  { to: '/talent-pool',  icon: Star,             label: 'Banco de Talentos', roles: ['ADMIN', 'RECRUITER'] },
  { to: '/email-config', icon: Mail,             label: 'Config. E-mail',    roles: ['ADMIN'] },
  { to: '/users',        icon: Users,            label: 'Usuários',          roles: ['ADMIN', 'RECRUITER'] },
]

interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export function Sidebar({ mobile, onClose }: SidebarProps) {
  const { session, signOut } = useAuth()
  const { role } = useCurrentUser()
  const navigate = useNavigate()
  const { startTour } = useOnboardingTour()

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) { toast.error('Mínimo de 6 caracteres'); return }
    if (newPassword !== confirmPassword) { toast.error('As senhas não coincidem'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Senha alterada com sucesso!')
    setShowPasswordModal(false)
    setNewPassword('')
    setConfirmPassword('')
  }

  const visibleLinks = role ? links.filter((l) => l.roles.includes(role)) : []

  return (
    <>
      <div className={clsx('flex flex-col h-full bg-sidebar-bg', mobile ? 'w-full' : 'w-60')}>
        <div className="px-5 py-6 border-b border-white/5" data-tour="brand">
          <img src="/logo_principal.svg" alt="GEHFER" className="h-9 w-auto rounded-md" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              data-tour={`nav-${to.replace('/', '')}`}
              className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary-100 text-xs font-bold">
              {session?.user.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{session?.user.email}</p>
            </div>
          </div>
          <button onClick={() => startTour()} className="sidebar-link w-full">
            <HelpCircle className="h-4 w-4 shrink-0" />
            Tutorial
          </button>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="sidebar-link w-full"
          >
            <KeyRound className="h-4 w-4 shrink-0" />
            Alterar senha
          </button>
          <button onClick={handleSignOut} className="sidebar-link w-full">
            <LogOut className="h-4 w-4 shrink-0" />
            Sair
          </button>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-900">Alterar senha</h3>
              <button
                onClick={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword('') }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Nova senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirmar nova senha"
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <div className="flex gap-2 justify-end pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => { setShowPasswordModal(false); setNewPassword(''); setConfirmPassword('') }}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={saving}>
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
