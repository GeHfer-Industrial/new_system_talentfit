import { clsx } from 'clsx'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-slate-100 text-slate-600',
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

export function ClassificationBadge({ classification }: { classification: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    COMPATIBLE: { label: 'Compatível', variant: 'success' },
    PARTIAL: { label: 'Parcial', variant: 'warning' },
    TALENT_POOL: { label: 'Sem vaga compatível', variant: 'info' },
  }
  const { label, variant } = map[classification] ?? { label: classification, variant: 'neutral' }
  return <Badge variant={variant}>{label}</Badge>
}
