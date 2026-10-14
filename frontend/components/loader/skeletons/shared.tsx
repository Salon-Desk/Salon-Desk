import type { ComponentProps } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SkeletonPageHeader({
  subtitle = true,
  titleWidth = "w-48",
  subtitleWidth = "w-72",
  className,
}: {
  subtitle?: boolean;
  titleWidth?: string;
  subtitleWidth?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Skeleton className={cn("h-5 max-w-full rounded-md", titleWidth)} />
      {subtitle ? (
        <Skeleton className={cn("h-3 max-w-full rounded-md", subtitleWidth)} />
      ) : null}
    </div>
  );
}

export function SkeletonSearchField({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("h-12 w-full min-w-0 max-w-md rounded-full", className)}
    />
  );
}

export function SkeletonFilterChip({ className }: { className?: string }) {
  return (
    <Skeleton className={cn("h-10 w-24 shrink-0 rounded-3xl", className)} />
  );
}

export function SkeletonPrimaryCTA({ className }: { className?: string }) {
  return (
    <Skeleton className={cn("h-10 w-28 shrink-0 rounded-full", className)} />
  );
}

export function SkeletonIconButton({ className }: { className?: string }) {
  return <Skeleton className={cn("size-9 shrink-0 rounded-full", className)} />;
}

export function SkeletonTableToolbar({
  className,
  extraChips = 2,
}: {
  className?: string;
  extraChips?: number;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <SkeletonSearchField className="lg:max-w-md" />
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: extraChips }).map((_, i) => (
          <SkeletonFilterChip key={i} />
        ))}
      </div>
    </div>
  );
}

type DivProps = ComponentProps<"div">;

export function SkeletonTableFrame({
  className,
  children,
  ...props
}: DivProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SkeletonTableHeaderRow({
  cells,
  showCheckbox,
}: {
  cells: number;
  showCheckbox?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border bg-muted px-4 py-3">
      {showCheckbox ? (
        <Skeleton className="size-4 shrink-0 rounded-sm" />
      ) : null}
      {Array.from({ length: cells }).map((_, i) => (
        <Skeleton key={i} className="h-4 max-w-32 flex-1 rounded-md" />
      ))}
    </div>
  );
}

export function SkeletonTableBodyRow({
  cells,
  showCheckbox,
}: {
  cells: number;
  showCheckbox?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 odd:bg-transparent even:bg-muted/30">
      {showCheckbox ? (
        <Skeleton className="size-4 shrink-0 rounded-sm" />
      ) : null}
      {Array.from({ length: cells }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1 rounded-md min-w-0" />
      ))}
    </div>
  );
}

export function SkeletonPaginationRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-8 rounded-md" />
      ))}
    </div>
  );
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-5",
        className,
      )}
    >
      <Skeleton className="h-3 w-20 rounded-md" />
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-2 w-12 rounded-md" />
    </div>
  );
}

export function SkeletonFormField({
  fullWidth,
  className,
}: {
  fullWidth?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        fullWidth && "md:col-span-2",
        className,
      )}
    >
      <Skeleton className="h-4 w-24 rounded-md" />
      <Skeleton className="h-11 w-full rounded-full" />
    </div>
  );
}
