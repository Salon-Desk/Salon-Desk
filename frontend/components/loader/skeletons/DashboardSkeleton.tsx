import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { SkeletonStatCard } from './shared'

export type DashboardSkeletonProps = {
  className?: string
  statCount?: number
}

const DashboardSkeleton = ({ className, statCount = 4 }: DashboardSkeletonProps) => {
  return (
    <div className={cn('flex flex-col gap-6 p-6 sm:p-8', className)}>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40 max-w-full rounded-md" />
        <Skeleton className="h-4 w-full max-w-xl rounded-md" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: statCount }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <Skeleton className="mb-4 h-5 w-32 rounded-md" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  )
}

export default DashboardSkeleton
