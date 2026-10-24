'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface TablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange?: (page: number) => void
  setCurrentPage?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export type PaginationProps = TablePaginationProps

export const renderPageNumbers = (
  currentPage: number,
  totalPages: number,
  totalItems: number,
  pageSize: number,
  setCurrentPage: (page: number) => void,
  options?: {
    onPageSizeChange?: (size: number) => void
    pageSizeOptions?: number[]
    className?: string
  },
) => {
  const safeTotalPages = Math.max(1, totalPages || 1)
  const safeCurrentPage = Math.max(1, Math.min(currentPage, safeTotalPages))
  const pageNumbers: number[] = []
  const maxPageNumbersToShow = 5

  let startPage = Math.max(1, safeCurrentPage - Math.floor(maxPageNumbersToShow / 2))
  let endPage = startPage + maxPageNumbersToShow - 1

  if (endPage > safeTotalPages) {
    endPage = safeTotalPages
    startPage = Math.max(1, endPage - maxPageNumbersToShow + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i)
  }

  const showFirstPage = startPage > 1
  const showEllipsesBefore = startPage > 2
  const showLastPage = endPage < safeTotalPages
  const showEllipsesAfter = endPage < safeTotalPages - 1

  // ✅ CALCULATE STATS
  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-xs sm:px-5 md:flex-row',
        options?.className,
      )}
    >
      {/* ✅ LEFT: STATISTICS */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-xs text-muted-foreground sm:text-[14px] lg:text-[16px]">Showing</span>
        <span className="text-base font-extrabold text-foreground sm:text-lg lg:text-xl">
          {startItem}-{endItem}
        </span>
        <span className="text-xs text-muted-foreground sm:text-[14px] lg:text-[16px]">of</span>
        <span className="text-base font-extrabold text-foreground sm:text-lg lg:text-xl">
          {totalItems}
        </span>

        {options?.onPageSizeChange &&
          options?.pageSizeOptions &&
          options.pageSizeOptions.length > 0 && (
            <div className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground sm:ml-4">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => options.onPageSizeChange?.(Number(e.target.value))}
                className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {options.pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
      </div>

      {/* ✅ RIGHT: PAGINATION */}
      <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1 scrollbar-hide sm:gap-3">
        {/* Prev */}
        <button
          type="button"
          onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage <= 1}
          aria-label="Previous page"
          className="shrink-0 cursor-pointer rounded-full border border-border p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:p-3"
        >
          <ChevronLeft className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
        </button>

        {/* Pages */}
        <div className="flex items-center gap-1 sm:gap-2">
          {showFirstPage && (
            <>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-sm text-foreground transition-colors hover:bg-muted sm:h-10 sm:w-10"
              >
                1
              </button>
              {showEllipsesBefore && startPage > 2 && (
                <span className="select-none px-1 text-muted-foreground">...</span>
              )}
            </>
          )}

          {pageNumbers.map((page) => (
            <button
              type="button"
              key={page}
              onClick={() => setCurrentPage(page)}
              className={cn(
                'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border text-sm transition-all sm:h-10 sm:w-10',
                page === safeCurrentPage
                  ? 'border-primary bg-primary font-semibold text-primary-foreground gold-glow'
                  : 'border-border text-foreground hover:bg-muted',
              )}
            >
              {page}
            </button>
          ))}

          {showLastPage && (
            <>
              {showEllipsesAfter && endPage < safeTotalPages - 1 && (
                <span className="select-none px-1 text-muted-foreground">...</span>
              )}
              <button
                type="button"
                onClick={() => setCurrentPage(safeTotalPages)}
                className={cn(
                  'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border text-sm transition-all sm:h-10 sm:w-10',
                  safeCurrentPage === safeTotalPages
                    ? 'border-primary bg-primary font-semibold text-primary-foreground gold-glow'
                    : 'border-border text-foreground hover:bg-muted',
                )}
              >
                {safeTotalPages}
              </button>
            </>
          )}
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={() => setCurrentPage(Math.min(safeTotalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage >= safeTotalPages || safeTotalPages === 0}
          aria-label="Next page"
          className="shrink-0 cursor-pointer rounded-full border border-border p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:p-3"
        >
          <ChevronRight className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  )
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  setCurrentPage,
  onPageSizeChange,
  pageSizeOptions,
  className,
}: TablePaginationProps) {
  if (totalItems === 0) return null
  const handlePageChange = onPageChange || setCurrentPage || (() => {})
  return renderPageNumbers(currentPage, totalPages, totalItems, pageSize, handlePageChange, {
    onPageSizeChange,
    pageSizeOptions,
    className,
  })
}

export const TablePagination = Pagination
export default Pagination
