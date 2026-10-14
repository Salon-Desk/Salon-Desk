// components/table/Pagination.tsx

import { ChevronLeft, ChevronRight } from 'lucide-react'
export const renderPageNumbers = (
  currentPage: number,
  totalPages: number,
  totalItems: number,
  pageSize: number,
  setCurrentPage: (page: number) => void,
) => {
  const pageNumbers = []
  const maxPageNumbersToShow = 5

  let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbersToShow / 2))
  let endPage = startPage + maxPageNumbersToShow - 1

  if (endPage > totalPages) {
    endPage = totalPages
    startPage = Math.max(1, endPage - maxPageNumbersToShow + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i)
  }

  const showFirstPage = startPage > 1
  const showEllipsesBefore = startPage > 2
  const showLastPage = endPage < totalPages
  const showEllipsesAfter = endPage < totalPages - 1

  // ✅ CALCULATE STATS
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="px-3 sm:px-5 py-3 shadow-[0px_-1px_4px_0px_#0000000A] flex flex-col md:flex-row justify-between items-center rounded-b-2xl bg-background gap-4">
      {/* ✅ LEFT: STATISTICS */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="text-text-color text-xs sm:text-[14px] lg:text-[16px]">Showing</span>
        <span className="text-foreground font-extrabold text-base sm:text-lg lg:text-xl">
          {startItem}-{endItem}
        </span>
        <span className="text-text-color text-xs sm:text-[14px] lg:text-[16px]">of</span>
        <span className="text-foreground font-extrabold text-base sm:text-lg lg:text-xl">
          {totalItems}
        </span>
      </div>

      {/* ✅ RIGHT: PAGINATION */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto max-w-full pb-1 scrollbar-hide">
        {/* Prev */}
        <button
          type="button"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 sm:p-3 rounded-full border border-border disabled:opacity-50 shrink-0"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </button>

        {/* Pages */}
        <div className="flex items-center gap-1 sm:gap-2">
          {showFirstPage && (
            <>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-border text-sm shrink-0"
              >
                1
              </button>
              {showEllipsesBefore && startPage > 2 && (
                <span className="text-muted-foreground px-1">...</span>
              )}
            </>
          )}

          {pageNumbers.map((page) => (
            <button
              type="button"
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border text-sm shrink-0 ${
                page === currentPage
                  ? 'bg-primary text-primary-foreground border-primary gold-glow'
                  : 'border-border text-foreground hover:bg-muted'
              }`}
            >
              {page}
            </button>
          ))}

          {showLastPage && (
            <>
              {showEllipsesAfter && endPage < totalPages - 1 && (
                <span className="text-muted-foreground px-1">...</span>
              )}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border text-sm shrink-0 ${
                  currentPage === totalPages
                    ? 'bg-primary text-primary-foreground border-primary gold-glow'
                    : 'border-border text-foreground hover:bg-muted'
                }`}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 sm:p-3 rounded-full border border-border disabled:opacity-50 shrink-0"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </button>
      </div>
    </div>
  )
}
