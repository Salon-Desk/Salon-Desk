'use client'

import type { ReactNode } from 'react'

import { CatalogServiceSkeletonGrid } from './CatalogServiceSkeleton'

interface CatalogSectionProps {
  title: string
  subtitle?: string
  eyebrow?: string
  icon?: ReactNode
  tone?: 'amber' | 'emerald' | 'purple' | 'stone'
  variant?: 'default' | 'island' | 'subtle'
  totalCount: number
  loadedCount: number
  hasMore: boolean
  onShowMore: () => void
  isLoading?: boolean
  isLoadingMore?: boolean
  viewMode?: 'grid' | 'list'
  showTopDivider?: boolean
  empty?: ReactNode
  children: ReactNode
}

export function CatalogSection({
  title,
  subtitle,
  eyebrow,
  icon,
  tone = 'amber',
  variant = 'default',
  totalCount,
  loadedCount,
  hasMore,
  onShowMore,
  isLoading = false,
  isLoadingMore = false,
  viewMode = 'grid',
  showTopDivider = false,
  empty,
  children,
}: CatalogSectionProps) {
  const hasItems = loadedCount > 0

  const toneClasses = {
    amber: 'bg-amber-100/70 text-amber-800 border-amber-200/60',
    emerald: 'bg-emerald-100/70 text-emerald-800 border-emerald-200/60',
    purple: 'bg-purple-100/70 text-purple-800 border-purple-200/60',
    stone: 'bg-stone-100 text-stone-800 border-stone-200/60',
  }[tone]

  const containerClasses = {
    default: 'mb-12 sm:mb-16',
    island:
      'mb-12 sm:mb-16 relative overflow-hidden rounded-3xl border border-stone-200/90 bg-gradient-to-b from-stone-50/80 via-white to-stone-50/40 p-5 sm:p-8 shadow-xs',
    subtle:
      'mb-12 sm:mb-16 relative overflow-hidden rounded-3xl border border-stone-200/70 bg-stone-50/60 p-5 sm:p-8',
  }[variant]

  return (
    <section className={containerClasses}>
      {/* Decorative ambient flare for island variant */}
      {variant === 'island' && (
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl" />
      )}

      {showTopDivider && variant === 'default' && (
        <div className="mb-10 sm:mb-14 flex items-center justify-center">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-stone-200/90 to-transparent" />
        </div>
      )}

      {/* Modern Section Header */}
      <div className="relative z-10 mb-6 sm:mb-8 flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {(eyebrow || icon) && (
            <div className="mb-2 flex items-center gap-2">
              {icon && (
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs shadow-2xs ${toneClasses}`}
                >
                  {icon}
                </span>
              )}
              {eyebrow && (
                <span className="font-bold text-[10px] sm:text-[11px] text-stone-500 uppercase tracking-widest">
                  {eyebrow}
                </span>
              )}
            </div>
          )}

          <h2 className="font-extrabold text-xl text-stone-950 sm:text-2xl tracking-tight">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-xs text-stone-500 sm:text-sm leading-relaxed">{subtitle}</p>
          ) : null}
        </div>

        {!isLoading && hasItems ? (
          <span className="inline-flex shrink-0 items-center rounded-full bg-stone-100 px-3 py-1 font-semibold text-[11px] text-stone-600">
            Showing {loadedCount}
            {totalCount > 0 ? ` of ${totalCount}` : ''}
          </span>
        ) : null}
      </div>

      {isLoading ? <CatalogServiceSkeletonGrid count={6} /> : null}

      {!isLoading && !hasItems && empty ? empty : null}

      {!isLoading && hasItems ? (
        <>
          <div
            className={
              viewMode === 'list'
                ? 'flex flex-col gap-4'
                : 'grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-y-12 lg:grid-cols-3'
            }
          >
            {children}
          </div>
          {hasMore ? (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={onShowMore}
                disabled={isLoadingMore}
                className="cursor-pointer rounded-full border border-stone-200 bg-white px-7 py-2.5 font-bold text-xs text-stone-800 shadow-2xs transition-all hover:border-amber-400 hover:bg-stone-50 hover:shadow-xs disabled:cursor-wait disabled:opacity-60"
              >
                {isLoadingMore ? 'Loading more treatments…' : 'Load more treatments'}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
