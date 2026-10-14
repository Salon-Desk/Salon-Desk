import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type AuthFormSkeletonProps = {
  className?: string;
  fields?: number;
};

const AuthFormSkeleton = ({ className, fields = 3 }: AuthFormSkeletonProps) => {
  return (
    <div
      className={cn(
        "flex min-h-full w-full flex-col rounded-2xl bg-background p-4 sm:p-8 md:p-12 xl:p-14 md:rounded-4xl xl:rounded-[48px] 2xl:rounded-[52px]",
        className,
      )}
    >
      <div className="mb-4 flex w-full justify-end sm:mb-6">
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>

      <div className="flex w-full flex-1 items-center justify-center">
        <div className="flex w-full max-w-full flex-col gap-6 rounded-[48px] border border-light-text bg-background p-6 ring-1 ring-border sm:max-w-[450px] sm:gap-8 sm:p-8 md:max-w-[700px] md:gap-10 md:p-10">
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <Skeleton className="mx-auto h-8 w-48 rounded-md sm:mx-0 sm:h-9 sm:w-56" />
            <Skeleton className="mx-auto h-4 w-full max-w-md rounded-md sm:mx-0" />
            <Skeleton className="mx-auto h-4 w-full max-w-sm rounded-md sm:mx-0" />
          </div>

          <div className="flex flex-col gap-4">
            {Array.from({ length: fields }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-12 w-full rounded-full" />
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 pt-1">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="mx-auto h-4 w-48 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthFormSkeleton;
