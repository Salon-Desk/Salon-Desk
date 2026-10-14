import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  SkeletonPaginationRow,
  SkeletonTableBodyRow,
  SkeletonTableFrame,
  SkeletonTableHeaderRow,
  SkeletonTableToolbar,
} from "./shared";

export type TableSkeletonProps = {
  className?: string;
  /** Matches optional BasicDataGrid title block */
  showTitle?: boolean;
  rows?: number;
  columns?: number;
  showRowSelection?: boolean;
  showPagination?: boolean;
  variant?: "default" | "table";
};

const TableSkeleton = ({
  variant = "default",
  className,
  showTitle = false,
  rows = 6,
  columns = 5,
  showRowSelection = true,
  showPagination = true,
}: TableSkeletonProps) => {
  if (variant === "table") {
    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full sm:max-w-md rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>

        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-3"
              style={{
                gridTemplateColumns: `repeat(${Math.max(columns, 1)}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: Math.max(columns, 1) }).map(
                (__, colIdx) => (
                  <Skeleton
                    key={`${rowIdx}-${colIdx}`}
                    className="h-6 w-full rounded-md"
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto w-full space-y-6 rounded-2xl bg-background p-4",
        className,
      )}
    >
      {showTitle ? (
        <div className="flex items-center justify-between">
          <div className="relative space-y-2">
            <Skeleton className="h-8 w-48 max-w-full rounded-md" />
            <Skeleton className="h-1 w-12 rounded-full bg-primary/30" />
          </div>
        </div>
      ) : null}

      <SkeletonTableToolbar />

      <SkeletonTableFrame>
        <SkeletonTableHeaderRow
          cells={columns}
          showCheckbox={showRowSelection}
        />
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableBodyRow
            key={i}
            cells={columns}
            showCheckbox={showRowSelection}
          />
        ))}
      </SkeletonTableFrame>

      {showPagination ? <SkeletonPaginationRow /> : null}
    </div>
  );
};

export default TableSkeleton;
