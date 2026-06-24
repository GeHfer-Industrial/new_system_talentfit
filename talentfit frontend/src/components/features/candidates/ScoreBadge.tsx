interface ScoreBadgeProps {
  score: number
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const color =
    score >= 40 ? 'bg-emerald-500' : score > 0 ? 'bg-amber-400' : 'bg-slate-300'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-2 w-24">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-8 text-right">{score}</span>
    </div>
  )
}
