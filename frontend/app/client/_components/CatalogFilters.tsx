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
    <div className="sticky top-16 z-30 mb-8 bg-white/90 py-2.5 backdrop-blur-xl">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
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
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {onOrganizationChange && organizations.length > 0 ? (
              <div className="relative min-w-[10rem] flex-1 sm:max-w-xs">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <select
                  value={organizationId}
                  aria-label="Filter by salon"
                  onChange={(e) => onOrganizationChange(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-full bg-stone-100 py-1.5 pl-8 pr-8 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-200/80 focus:outline-hidden"
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

            <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
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
          </div>

          <div className="relative shrink-0">
            <select
              value={sortBy}
              aria-label="Sort services"
              onChange={(e) => onSortChange(e.target.value as ServiceSort)}
              className="cursor-pointer appearance-none rounded-full bg-stone-100 py-1.5 pl-6 pr-6 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-200/80 focus:outline-hidden"
            >
              <option value="popular">Popular</option>
              <option value="price-asc">Price: Low</option>
              <option value="price-desc">Price: High</option>
              <option value="duration">Fastest</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-stone-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
