import { Skeleton } from "@/components/ui/skeleton";

const TransactionDetailSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 bg-background rounded-3xl sm:rounded-4xl">
      {/* Tabs Skeleton */}
      <div className="flex items-center justify-between gap-4 w-full py-2">
        <div className="flex gap-3 overflow-x-auto">
          <Skeleton className="h-12 w-32 rounded-2xl" />
          <Skeleton className="h-12 w-32 rounded-2xl" />
        </div>
        <Skeleton className="h-10 sm:h-14 w-32 sm:w-44 rounded-full" />
      </div>

      {/* Content Skeleton - Matching InvoiceDetailTab */}
      <div className="w-full p-4 sm:p-6 rounded-3xl shadow-[0px_0px_24px_0px_#0000000A] flex flex-col gap-10">
        <div className="flex flex-col lg:flex-row justify-between gap-8">
          <div className="flex-1 flex flex-col gap-6">
            <Skeleton className="h-20 w-36 rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-40 rounded-md" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-auto flex flex-col items-start lg:items-end gap-4">
            <Skeleton className="h-8 w-24 rounded-full" />
            <div className="flex flex-col gap-1 items-start lg:items-end">
              <Skeleton className="h-7 w-40 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
            <Skeleton className="w-[145px] h-[145px] rounded-xl" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-6 w-32 rounded-md" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
          <div className="rounded-2xl border border-border overflow-hidden">
            <Skeleton className="h-12 w-full" />
            <div className="p-4 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailSkeleton;
