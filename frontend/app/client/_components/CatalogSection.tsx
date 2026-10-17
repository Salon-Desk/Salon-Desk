'use client'

import type { ReactNode } from 'react'

import { CatalogServiceSkeletonGrid } from './CatalogServiceSkeleton'

interface CatalogSectionProps {
  title: string
  subtitle?: string
  totalCount: number
  loadedCount: number
  hasMore: boolean
  onShowMore: () => void
  isLoading?: boolean
  isLoadingMore?: boolean
  empty?: ReactNode
  children: ReactNode
}

export function CatalogSection({
  title,
  subtitle,
  totalCount,
  loadedCount,
  hasMore,
  onShowMore,
  isLoading = false,
  isLoadingMore = false,
  empty,
  children,
}: CatalogSectionProps) {
  const hasItems = loadedCount > 0

  return (
    <section className="mb-10 sm:mb-14">
      <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-stone-950 sm:text-xl">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">{subtitle}</p> : null}
        </div>
        {!isLoading && hasItems ? (
          <p className="shrink-0 text-[11px] font-medium text-stone-400">
            Showing {loadedCount}
            {totalCount > 0 ? ` of ${totalCount}` : ''}
          </p>
        ) : null}
      </div>

      {isLoading ? <CatalogServiceSkeletonGrid count={6} /> : null}

      {!isLoading && !hasItems && empty ? empty : null}

      {!isLoading && hasItems ? (
        <>
          <div className="grid grid-cols-1 gap-x-8 gap-y-9 sm:grid-cols-2 sm:gap-y-14 lg:grid-cols-3">
            {children}
          </div>
          {hasMore ? (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={onShowMore}
                disabled={isLoadingMore}
                className="rounded-full bg-stone-100 px-6 py-2.5 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-200 cursor-pointer disabled:cursor-wait disabled:opacity-60"
              >
                {isLoadingMore ? 'Loading…' : 'Show more'}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
