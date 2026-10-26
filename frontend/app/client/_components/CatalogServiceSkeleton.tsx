import { CatalogServiceSkeletonCard } from './CatalogServiceSkeletonCard'

export { CatalogServiceSkeletonCard }

export function CatalogServiceSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-14 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <CatalogServiceSkeletonCard key={i} />
      ))}
    </div>
  )
}
