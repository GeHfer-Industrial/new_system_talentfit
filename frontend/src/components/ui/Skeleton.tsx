import { clsx } from 'clsx'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('animate-pulse rounded-md bg-slate-200', className)} />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <tr>
      <td className="px-6 py-3"><Skeleton className="h-4 w-32" /></td>
      <td className="px-6 py-3"><Skeleton className="h-4 w-24" /></td>
      <td className="px-6 py-3"><Skeleton className="h-4 w-12" /></td>
      <td className="px-6 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
      <td className="px-6 py-3"><Skeleton className="h-4 w-16" /></td>
      <td className="px-6 py-3"><Skeleton className="h-4 w-16" /></td>
    </tr>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-16" />
    </div>
  )
}
