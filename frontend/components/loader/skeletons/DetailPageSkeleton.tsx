import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type DetailPageSkeletonProps = {
  className?: string
  tabCount?: number
}

const DetailPageSkeleton = ({ className, tabCount = 2 }: DetailPageSkeletonProps) => {
  return (
    <div className={cn('flex flex-col gap-4 rounded-4xl bg-background p-4 sm:p-6', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 rounded-full border border-border bg-muted/40 p-1">
          {Array.from({ length: tabCount }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-36 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-11 w-44 shrink-0 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 lg:col-span-2">
          <Skeleton className="h-5 w-40 rounded-md" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex justify-between gap-4 border-b border-border py-2 last:border-0"
              >
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-4 flex-1 max-w-xs rounded-md" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default DetailPageSkeleton
