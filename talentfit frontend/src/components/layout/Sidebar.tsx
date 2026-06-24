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
  ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '../../hooks/useAuth'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs', icon: Briefcase, label: 'Vagas' },
  { to: '/resumes', icon: FileText, label: 'Currículos' },
  { to: '/approved', icon: CheckCircle2, label: 'Aprovados' },
  { to: '/talent-pool', icon: Star, label: 'Banco de Talentos' },
  { to: '/email-config', icon: Mail, label: 'Config. E-mail' },
  { to: '/users', icon: Users, label: 'Usuários' },
]

interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export function Sidebar({ mobile, onClose }: SidebarProps) {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={clsx('flex flex-col h-full bg-sidebar-bg', mobile ? 'w-full' : 'w-60')}>
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <ChevronRight className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">TalentFit</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx('sidebar-link', isActive && 'active')
            }
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
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </div>
    </div>
  )
}
