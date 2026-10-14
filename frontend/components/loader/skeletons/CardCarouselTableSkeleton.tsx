import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import {
  SkeletonPaginationRow,
  SkeletonTableBodyRow,
  SkeletonTableFrame,
  SkeletonTableHeaderRow,
  SkeletonTableToolbar,
} from './shared'

export type CardCarouselTableSkeletonProps = {
  className?: string
  cards?: number
  tableRows?: number
  tableColumns?: number
}

function SkeletonMiniDepartmentCard() {
  return (
    <div className="flex h-[156px] min-w-[220px] shrink-0 flex-col rounded-b-3xl rounded-tr-3xl border border-border bg-card">
      <Skeleton className="h-8 w-28 rounded-br-2xl rounded-tl-2xl" />
      <div className="flex flex-1 flex-col gap-4 px-4 pb-4 pt-3">
        <Skeleton className="h-6 w-36 rounded-md" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="size-7 rounded-full ring-2 ring-card" />
              ))}
            </div>
            <Skeleton className="h-4 w-8 rounded-md" />
            <Skeleton className="h-4 w-10 rounded-md" />
          </div>
          <Skeleton className="size-4 rounded-md" />
        </div>
      </div>
    </div>
  )
}

const CardCarouselTableSkeleton = ({
  className,
  cards = 4,
  tableRows = 6,
  tableColumns = 6,
}: CardCarouselTableSkeletonProps) => {
  return (
    <div
      className={cn('flex flex-col gap-4 rounded-2xl bg-background p-1 md:p-2 lg:p-5', className)}
    >
      <div className="flex h-[188px] items-center rounded-4xl border border-border bg-card px-3 py-3">
        <div className="flex w-full items-center gap-2">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex flex-1 gap-3 overflow-hidden">
            {Array.from({ length: cards }).map((_, i) => (
              <SkeletonMiniDepartmentCard key={i} />
            ))}
          </div>
          <Skeleton className="size-8 shrink-0 rounded-full" />
        </div>
      </div>

      <div className="rounded-2xl bg-background px-1 py-1 md:px-2 md:py-2 lg:px-5 lg:py-5">
        <SkeletonTableToolbar extraChips={1} />
      </div>

      <SkeletonTableFrame>
        <SkeletonTableHeaderRow cells={tableColumns} showCheckbox />
        {Array.from({ length: tableRows }).map((_, i) => (
          <SkeletonTableBodyRow key={i} cells={tableColumns} showCheckbox />
        ))}
      </SkeletonTableFrame>

      <SkeletonPaginationRow />
    </div>
  )
}

export default CardCarouselTableSkeleton
