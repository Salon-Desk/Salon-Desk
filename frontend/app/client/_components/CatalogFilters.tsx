'use client'

import { ArrowUpDown, Building2, Search, X } from 'lucide-react'

import { SERVICE_CATEGORIES } from '@/lib/data/catalog'
import type { CatalogOrganization } from '@/types/api-org'

export type ServiceSort = 'popular' | 'price-asc' | 'price-desc' | 'duration' | 'rating'

interface CatalogFiltersProps {
  category: string
  onCategoryChange: (category: string) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  sortBy: ServiceSort
  onSortChange: (sort: ServiceSort) => void
  categories?: string[]
  organizations?: CatalogOrganization[]
  organizationId?: string
  onOrganizationChange?: (orgId: string) => void
}

function SortSelect({
  sortBy,
  onSortChange,
}: Pick<CatalogFiltersProps, 'sortBy' | 'onSortChange'>) {
  return (
    <>
      <select
        value={sortBy}
        aria-label="Sort services"
        onChange={(e) => onSortChange(e.target.value as ServiceSort)}
        className="cursor-pointer appearance-none rounded-full bg-stone-100 py-2 pl-7 pr-3 text-[16px] font-semibold text-stone-700 transition-colors hover:bg-stone-200/80 focus:outline-hidden sm:py-1.5 sm:pl-6 sm:pr-6 sm:text-xs"
      >
        <option value="popular">Popular</option>
        <option value="price-asc">Price: Low</option>
        <option value="price-desc">Price: High</option>
        <option value="duration">Fastest</option>
      </select>
      <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-stone-400 sm:left-2" />
    </>
  )
}

export function CatalogFilters({
  category,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  categories = [...SERVICE_CATEGORIES],
  organizations = [],
  organizationId = '',
  onOrganizationChange,
}: CatalogFiltersProps) {
  return (
    <div className="relative z-30 mb-6 py-1 sm:sticky sm:top-[calc(4rem+env(safe-area-inset-top))] sm:mb-8 sm:bg-white/90 sm:py-2.5 sm:backdrop-blur-xl">
      <div className="flex flex-col gap-2.5 sm:gap-3.5">
        <div className="-mx-4 flex scroll-px-4 items-center gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-none snap-x sm:mx-0 sm:scroll-px-0 sm:px-0">
          {categories.map((cat) => {
            const isSelected = category === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`snap-start shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs transition-all duration-200 ${
                  isSelected
                    ? 'scale-102 bg-stone-950 font-bold text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 sm:hidden">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              inputMode="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search services"
              aria-label="Search services"
              className="w-full rounded-full bg-stone-100 py-2 pl-10 pr-9 text-[16px] text-stone-900 placeholder:text-stone-400 focus:bg-stone-200/70 focus:outline-hidden [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-stone-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-wrap">
            {onOrganizationChange && organizations.length > 0 ? (
              <div className="relative min-w-0 flex-1 sm:min-w-[10rem] sm:max-w-xs">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <select
                  value={organizationId}
                  aria-label="Filter by salon"
                  onChange={(e) => onOrganizationChange(e.target.value)}
                  className="w-full cursor-pointer appearance-none truncate rounded-full bg-stone-100 py-2 pl-8 pr-4 text-[16px] font-medium text-stone-700 transition-colors hover:bg-stone-200/80 focus:outline-hidden sm:py-1.5 sm:pr-8 sm:text-xs"
                >
                  <option value="">All salons</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="relative hidden min-w-[12rem] flex-1 sm:block sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search services..."
                className="w-full rounded-full bg-stone-100 py-1.5 pl-8 pr-7 text-xs text-stone-900 placeholder:text-stone-400 transition-colors focus:bg-stone-200/70 focus:outline-hidden"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer p-0.5 text-stone-400 hover:text-stone-600"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </div>
            <div className="relative shrink-0 sm:hidden">
              <SortSelect sortBy={sortBy} onSortChange={onSortChange} />
            </div>
          </div>

          <div className="relative hidden shrink-0 sm:block">
            <SortSelect sortBy={sortBy} onSortChange={onSortChange} />
          </div>
        </div>
      </div>
    </div>
  )
}
