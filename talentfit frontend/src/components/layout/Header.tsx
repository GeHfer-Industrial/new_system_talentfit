import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/jobs': 'Vagas',
  '/jobs/new': 'Nova Vaga',
  '/resumes': 'Currículos',
  '/talent-pool': 'Banco de Talentos',
  '/email-config': 'Configuração de E-mail',
  '/users': 'Usuários',
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'TalentFit'

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center gap-4">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
    </header>
  )
}
