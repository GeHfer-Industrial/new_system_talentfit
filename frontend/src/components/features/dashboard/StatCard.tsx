import { LucideIcon } from 'lucide-react'
import { Card } from '../../ui/Card'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  color?: string
}

export function StatCard({ icon: Icon, label, value, color = 'text-primary' }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-xl">
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </Card>
  )
}
