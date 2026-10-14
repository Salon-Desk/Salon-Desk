import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { SkeletonSearchField } from './shared'

function SkeletonRoomCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      <Skeleton className="h-40 w-full rounded-t-3xl sm:h-[160px]" />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 flex-1 rounded-md" />
          <Skeleton className="h-6 w-24 shrink-0 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-2/3 rounded-md" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-9 flex-1 rounded-full" />
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export type RoomManagementPageSkeletonProps = {
  className?: string
  cards?: number
  isCardOnly?: boolean
  /** With `isCardOnly`, overrides the inner card grid (e.g. booking drawer uses 2 columns + tighter gaps). */
  cardGridClassName?: string
}

const defaultCardGridClass = 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'

const RoomManagementPageSkeleton = ({
  className,
  cards = 8,
  isCardOnly = false,
  cardGridClassName,
}: RoomManagementPageSkeletonProps) => {
  if (isCardOnly) {
    return (
      <div className={cn(cardGridClassName ?? defaultCardGridClass, className)}>
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonRoomCard key={i} />
        ))}
      </div>
    )
  }
  return (
    <div
      className={cn('flex flex-col gap-4 rounded-2xl bg-background p-1 md:p-2 lg:p-5', className)}
    >
      <div className="sticky top-0 z-10 -mx-1 rounded-2xl bg-background px-1 py-1 md:-mx-2 md:px-2 md:py-2 lg:-mx-5 lg:px-5 lg:py-5">
        <div className="flex flex-col gap-4">
          <SkeletonSearchField className="max-w-none" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonRoomCard key={i} />
        ))}
      </div>
    </div>
  )
}

export default RoomManagementPageSkeleton
