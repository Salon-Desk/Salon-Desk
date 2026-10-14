import { Skeleton } from "@/components/ui/skeleton";

export const BookingDetailSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 bg-background rounded-4xl">
      {/* Header / Tabs Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex gap-4 border-b border-border w-full sm:w-auto">
          <Skeleton className="h-10 w-24 rounded-none border-b-2 border-transparent" />
          <Skeleton className="h-10 w-24 rounded-none border-b-2 border-transparent" />
          <Skeleton className="h-10 w-24 rounded-none border-b-2 border-transparent" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Skeleton className="h-12 w-24 rounded-full" />
          <Skeleton className="h-12 w-24 rounded-full" />
          <Skeleton className="h-12 w-32 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Guest Summary Skeleton */}
        <div className="flex flex-col md:flex-row gap-4 w-full items-stretch">
          <Skeleton className="w-full md:w-56 h-[200px] md:h-auto aspect-square md:aspect-auto rounded-3xl" />
          <div className="flex-1 shadow-[0px_0px_24px_0px_#0000000A] p-4 rounded-3xl flex flex-col gap-6">
            <div className="w-full bg-[#F2F2F2] p-4 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Room Section Skeleton */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-48" />
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            <Skeleton className="w-full lg:max-w-md h-64 rounded-3xl shrink-0" />
            <div className="flex-1 flex flex-col gap-4 w-full">
              <Skeleton className="h-32 w-full rounded-3xl" />
              <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailSkeleton;
