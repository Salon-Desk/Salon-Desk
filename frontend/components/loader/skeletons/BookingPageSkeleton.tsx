import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  SkeletonPaginationRow,
  SkeletonTableBodyRow,
  SkeletonTableFrame,
  SkeletonTableHeaderRow,
} from "./shared";

export type BookingPageSkeletonProps = {
  className?: string;
  filterFields?: number;
  tableRows?: number;
  tableColumns?: number;
};

const BookingPageSkeleton = ({
  className,
  tableRows = 5,
  tableColumns = 6,
}: BookingPageSkeletonProps) => {
  return (
    <div className={cn("flex flex-col gap-4 rounded-4xl p-4", className)}>
      <div className="flex flex-col gap-4 rounded-2xl bg-background p-4 shadow-[0px_0px_24px_0px_#0000000A]">
        {/* header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
        </div>

        {/* filter section */}
        <div className="w-full min-w-0 rounded-3xl border-[0.4px] border-border bg-light-text-color p-4">
          <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:gap-3">
            <div className="grid w-full min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 lg:h-16 w-full rounded-full" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 lg:h-16 w-full rounded-full" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 lg:h-16 w-full rounded-full" />
              </div>
            </div>
            <div className="flex w-full shrink-0 justify-stretch lg:w-auto lg:justify-end">
              <Skeleton className="h-16 w-full lg:w-44 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Skeleton className="h-12 w-full max-w-sm rounded-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-12 w-24 rounded-3xl" />
            <Skeleton className="h-12 w-44 rounded-full" />
          </div>
        </div>

        <SkeletonTableFrame>
          <SkeletonTableHeaderRow cells={tableColumns} showCheckbox />
          {Array.from({ length: tableRows }).map((_, i) => (
            <SkeletonTableBodyRow key={i} cells={tableColumns} showCheckbox />
          ))}
        </SkeletonTableFrame>

        <SkeletonPaginationRow />
      </div>
    </div>
  );
};

export default BookingPageSkeleton;
