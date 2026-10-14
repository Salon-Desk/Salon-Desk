import { Fragment } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { SkeletonFormField, SkeletonPageHeader } from "./shared";

export type FormSkeletonProps = {
  className?: string;
  /** Number of single-column fields (excluding optional full-width rows) */
  fields?: number;
  /** Extra full-width rows (e.g. textarea, file upload) */
  fullWidthRows?: number;
  showActions?: boolean;
  showAvatar?: boolean;
  /** Horizontal stepper (e.g. add-room wizard) */
  showStepper?: boolean;
  stepCount?: number;
};

const FormSkeleton = ({
  className,
  fields = 4,
  fullWidthRows = 1,
  showActions = true,
  showAvatar = false,
  showStepper = false,
  stepCount = 4,
}: FormSkeletonProps) => {
  return (
    <div className={cn("flex w-full flex-col gap-6", className)}>
      {showStepper ? (
        <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:gap-3">
          {Array.from({ length: stepCount }).map((_, i) => (
            <Fragment key={i}>
              <Skeleton className="size-10 shrink-0 rounded-full" />
              {i < stepCount - 1 ? (
                <Skeleton className="hidden h-1 w-8 shrink-0 sm:block md:w-14" />
              ) : null}
            </Fragment>
          ))}
        </div>
      ) : null}

      <SkeletonPageHeader titleWidth="w-56" subtitleWidth="w-full max-w-md" />

      {showAvatar ? (
        <div className="flex flex-col items-center gap-3 md:flex-row md:items-start">
          <Skeleton className="size-24 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-10 w-full max-w-xs rounded-full" />
          </div>
        </div>
      ) : null}

      <div className="grid w-full min-w-0 grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
        <SkeletonFormField fullWidth />
        {Array.from({ length: fields }).map((_, i) => (
          <SkeletonFormField key={i} />
        ))}
        {Array.from({ length: fullWidthRows }).map((_, i) => (
          <SkeletonFormField key={`fw-${i}`} fullWidth />
        ))}
      </div>

      {showActions ? (
        <div className="flex flex-wrap gap-3 pt-2">
          <Skeleton className="h-11 w-32 rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
      ) : null}
    </div>
  );
};

export default FormSkeleton;
