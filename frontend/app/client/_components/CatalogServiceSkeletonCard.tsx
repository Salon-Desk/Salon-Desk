import { Skeleton } from '@/components/ui/skeleton'

export function CatalogServiceSkeletonCard() {
  return (
    <article className="flex flex-col">
      <Skeleton className="aspect-[4/3] w-full rounded-3xl bg-stone-200/80 sm:aspect-[16/11]" />
      <div className="flex flex-1 flex-col pt-3.5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-16 rounded-full bg-stone-200/80" />
          <Skeleton className="h-6 w-12 rounded-md bg-stone-200/80" />
        </div>
        <Skeleton className="h-4 w-3/4 rounded-md bg-stone-200/80" />
        <Skeleton className="mt-1.5 h-3 w-1/2 rounded-md bg-stone-200/70" />
        <Skeleton className="mt-2 h-8 w-full rounded-md bg-stone-200/60" />
        <div className="mt-4 flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1 rounded-full bg-stone-200/80" />
          <Skeleton className="h-9 w-16 rounded-full bg-stone-200/80" />
        </div>
      </div>
    </article>
  )
}
