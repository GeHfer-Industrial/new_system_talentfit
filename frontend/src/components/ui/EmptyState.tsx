import { LucideIcon } from 'lucide-react'
import { FolderOpen } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
}

export function EmptyState({
  title = 'Nenhum item encontrado',
  description = 'Não há dados para exibir no momento.',
  icon: Icon = FolderOpen,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-slate-100 rounded-full mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-slate-700 font-semibold mb-1">{title}</h3>
      <p className="text-slate-500 text-sm max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
