import { FileText, Briefcase, CheckCircle, Star } from 'lucide-react'
import { StatCard } from '../components/features/dashboard/StatCard'
import { DepartmentChart } from '../components/features/dashboard/DepartmentChart'
import { ClassificationBadge } from '../components/ui/Badge'
import { ScoreBadge } from '../components/features/candidates/ScoreBadge'
import { Card } from '../components/ui/Card'
import { SkeletonStatCard, SkeletonRow } from '../components/ui/Skeleton'
import { useDashboardStats, useRecentResumes } from '../hooks/useDashboard'
import { EmptyState } from '../components/ui/EmptyState'

export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useDashboardStats()
  const { data: recent, isLoading: loadingRecent } = useRecentResumes()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-tour="dashboard-stats">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard icon={FileText} label="Total de currículos" value={stats?.totalResumes ?? 0} />
            <StatCard icon={Briefcase} label="Vagas abertas" value={stats?.openJobs ?? 0} color="text-emerald-500" />
            <StatCard icon={CheckCircle} label="Classificados hoje" value={stats?.classifiedToday ?? 0} color="text-amber-500" />
            <StatCard icon={Star} label="Banco de talentos" value={stats?.talentPoolTotal ?? 0} color="text-purple-500" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2" data-tour="dashboard-chart">
          <h2 className="font-semibold text-slate-900 mb-4">Currículos por departamento</h2>
          {stats?.byDepartment.length ? (
            <DepartmentChart data={stats.byDepartment} />
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">Sem dados ainda</p>
          )}
        </Card>

        <Card className="lg:col-span-3" padding="none" data-tour="dashboard-recent">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Últimos currículos classificados</h2>
          </div>
          {loadingRecent ? (
            <table className="w-full">
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          ) : !recent?.length ? (
            <EmptyState title="Sem currículos ainda" description="Faça o upload de currículos para começar." />
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.candidate.name}</p>
                    <p className="text-xs text-slate-500 truncate">{r.job?.title ?? 'Sem vaga'}</p>
                  </div>
                  <ScoreBadge score={r.score} />
                  <ClassificationBadge classification={r.classification} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
