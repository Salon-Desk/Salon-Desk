'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface TablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [6, 12, 24, 48],
  className,
}: TablePaginationProps) {
  if (totalItems === 0) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate page numbers window (up to 5 pages)
  const maxButtons = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2))
  let endPage = startPage + maxButtons - 1

  if (endPage > totalPages) {
    endPage = totalPages
    startPage = Math.max(1, endPage - maxButtons + 1)
  }

  const pages: number[] = []
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500',
        className,
      )}
    >
      {/* Left: Summary and Page Size */}
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Showing <strong className="font-semibold text-slate-900">{startItem}</strong> to{' '}
          <strong className="font-semibold text-slate-900">{endItem}</strong> of{' '}
          <strong className="font-semibold text-slate-900">{totalItems}</strong> results
        </span>

        {onPageSizeChange ? (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-xs focus:border-amber-500 focus:outline-hidden"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {/* Right: Page Navigation Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            aria-label="First page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>

          {/* Prev page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Page numbers */}
          {pages.map((p) => {
            const isActive = p === currentPage
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-semibold transition shadow-xs',
                  isActive
                    ? 'border border-amber-600 bg-amber-600 text-white shadow-amber-600/20'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                {p}
              </button>
            )
          })}

          {/* Next page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {/* Last page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            aria-label="Last page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
