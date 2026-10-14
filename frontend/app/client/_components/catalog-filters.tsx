'use client'

import { ArrowUpDown, Search, X } from 'lucide-react'

import { SERVICE_CATEGORIES } from '@/lib/data/catalog'

export type ServiceSort = 'popular' | 'price-asc' | 'price-desc' | 'duration' | 'rating'

interface CatalogFiltersProps {
  category: string
  onCategoryChange: (category: string) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  sortBy: ServiceSort
  onSortChange: (sort: ServiceSort) => void
}

export function CatalogFilters({
  category,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: CatalogFiltersProps) {
  return (
    <div className="sticky top-16 z-30 mb-8 py-2.5 bg-white/90 backdrop-blur-xl">
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills - Borderless & Shadowless */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none snap-x">
          {SERVICE_CATEGORIES.map((cat) => {
            const isSelected = category === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`snap-start shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-stone-950 font-bold text-white scale-102'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Search & Sort Controls - Clean Minimal */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search services..."
              className="w-full rounded-full bg-stone-100 py-1.5 pl-8 pr-7 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-stone-200/70 focus:outline-hidden transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <select
              value={sortBy}
              aria-label="Sort services"
              onChange={(e) => onSortChange(e.target.value as ServiceSort)}
              className="cursor-pointer appearance-none rounded-full bg-stone-100 py-1.5 pl-6 pr-6 font-semibold text-stone-700 text-xs hover:bg-stone-200/80 focus:outline-hidden transition-colors"
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
