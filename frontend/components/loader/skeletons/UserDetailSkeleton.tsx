import { Skeleton } from "@/components/ui/skeleton";

export const UserDetailSkeleton = () => {
  return (
    <div className="w-full bg-background p-1 md:p-2 lg:p-5 rounded-4xl">
      {/* Tab Header Skeleton */}
      <div className="flex gap-4 mb-6 border-b border-border pb-2">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      <div className="flex flex-col gap-6">
        {/* Top Section: Info and Actions */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* User Info Card Skeleton */}
          <div className="flex-1 bg-white rounded-2xl border border-border p-5 flex gap-5">
            <Skeleton className="shrink-0 w-32 h-32 rounded-2xl" />
            <div className="flex flex-col gap-4 flex-1">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Permissions Table Skeleton */}
        <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 px-4">
                    <Skeleton className="h-4 w-32" />
                  </th>
                  {[...Array(4)].map((_, i) => (
                    <th key={i} className="py-3 px-4">
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    {[...Array(4)].map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <Skeleton className="h-5 w-5 mx-auto rounded" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailSkeleton;
