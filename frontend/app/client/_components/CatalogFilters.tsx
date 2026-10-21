'use client'

import {
  ArrowUpDown,
  Building2,
  DollarSign,
  Grid,
  List,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react'
import { useState } from 'react'

import { SearchableSelect } from '@/components/ui'
import { SERVICE_CATEGORIES } from '@/lib/data/catalog'
import type { CatalogOrganization } from '@/types/api-org'
import type { SearchableListControls } from '@/types/searchable-list-controls'

export type ServiceSort =
  'popular' | 'rating' | 'price-asc' | 'price-desc' | 'duration' | 'distance'
export type PriceRange = 'all' | 'under-50' | '50-100' | '100-150' | '150-plus'

interface CatalogFiltersProps {
  category: string
  onCategoryChange: (category: string) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  sortBy: ServiceSort
  onSortChange: (sort: ServiceSort) => void
  priceRange?: PriceRange
  onPriceRangeChange?: (range: PriceRange) => void
  minRating?: number | null
  onMinRatingChange?: (rating: number | null) => void
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  categories?: string[]
  organizations?: CatalogOrganization[]
  organizationId?: string
  onOrganizationChange?: (orgId: string) => void
  organizationListControls?: SearchableListControls
  categoryListControls?: SearchableListControls
  onClearAll?: () => void
}

const PRICE_TIERS: { id: PriceRange; label: string }[] = [
  { id: 'all', label: 'All Prices' },
  { id: 'under-50', label: 'Under $50' },
  { id: '50-100', label: '$50 – $100' },
  { id: '100-150', label: '$100 – $150' },
  { id: '150-plus', label: '$150+' },
]

const RATING_TIERS: { value: number | null; label: string }[] = [
  { value: null, label: 'All Ratings' },
  { value: 4.5, label: '4.5★ & up' },
  { value: 4.0, label: '4.0★ & up' },
]

export function CatalogFilters({
  category,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  priceRange = 'all',
  onPriceRangeChange,
  minRating = null,
  onMinRatingChange,
  viewMode = 'grid',
  onViewModeChange,
  categories = [...SERVICE_CATEGORIES],
  organizations = [],
  organizationId = '',
  onOrganizationChange,
  organizationListControls,
  categoryListControls,
  onClearAll,
}: CatalogFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const activeFiltersCount =
    (category !== 'All' ? 1 : 0) +
    (organizationId ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0) +
    (priceRange !== 'all' ? 1 : 0) +
    (minRating !== null ? 1 : 0)

  return (
    <div className="relative z-30 mb-8 rounded-2xl border border-stone-200/80 bg-white/95 p-3 shadow-xs backdrop-blur-xl transition-all sm:sticky sm:top-[calc(4.25rem+env(safe-area-inset-top))] sm:mb-12 sm:rounded-3xl sm:p-4 sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {/* Row 1: Category search + scroll bar */}
        {categoryListControls ? (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              placeholder="Search categories…"
              className="w-full rounded-full border border-stone-200 bg-stone-50 py-1.5 pl-9 pr-3 text-xs text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-hidden"
              onChange={(e) => categoryListControls.onSearchChange(e.target.value)}
            />
          </div>
        ) : null}
        <div className="flex scroll-px-2 items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
          {categories.map((cat) => {
            const isSelected = category === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`snap-start shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs transition-all duration-200 ${
                  isSelected
                    ? 'scale-102 bg-stone-950 font-bold text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {cat}
              </button>
            )
          })}
          {categoryListControls?.hasMore ? (
            <button
              type="button"
              onClick={() => categoryListControls.onLoadMore()}
              disabled={categoryListControls.isLoadingMore}
              className="snap-start shrink-0 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-50"
            >
              {categoryListControls.isLoadingMore ? 'Loading…' : 'More categories'}
            </button>
          ) : null}
        </div>

        {/* Subtle Horizontal Divider */}
        <div className="hidden sm:block h-px w-full bg-stone-100" />

        {/* Row 2: Search, Salon Select, Sort & View Mode Toolbar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Mobile Search */}
          <div className="relative min-w-0 sm:hidden">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              inputMode="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search treatments or salons…"
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

          {/* Left Controls: Desktop Search & Salon Select */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {/* Desktop Search */}
            <div className="relative hidden min-w-[12rem] flex-1 sm:block sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search treatments…"
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

            {/* Salon Filter Searchable Combobox */}
            {onOrganizationChange ? (
              <div className="min-w-0 flex-1 sm:min-w-[12rem] sm:max-w-xs">
                <SearchableSelect
                  value={organizationId}
                  onChange={onOrganizationChange}
                  options={organizations.map((org) => ({
                    value: org.id,
                    label: org.name,
                    description: org.physical_address || undefined,
                    badge:
                      typeof org.rating_avg === 'number' && org.rating_avg > 0
                        ? `★ ${org.rating_avg.toFixed(1)}`
                        : undefined,
                  }))}
                  placeholder={`All Salons (${organizationListControls?.total ?? organizations.length})`}
                  clearLabel={`All Salons (${organizationListControls?.total ?? organizations.length})`}
                  allowClear
                  searchPlaceholder="Search salons by name or address..."
                  emptyText="No matching salons found."
                  aria-label="Filter by salon"
                  leftIcon={<Building2 className="h-3.5 w-3.5 text-stone-500" />}
                  triggerClassName="rounded-full bg-stone-100 py-1.5 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-200/80 transition-colors"
                  contentClassName="w-[min(calc(100vw-2rem),18rem)] rounded-2xl border-stone-200"
                  onSearchChange={organizationListControls?.onSearchChange}
                  hasMore={organizationListControls?.hasMore}
                  onLoadMore={organizationListControls?.onLoadMore}
                  isLoadingMore={organizationListControls?.isLoadingMore}
                  loadMoreLabel="Load more salons"
                />
              </div>
            ) : null}

            {/* Advanced Filters Button (Price & Rating) */}
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                showAdvanced || priceRange !== 'all' || minRating !== null
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>Filters</span>
              {(priceRange !== 'all' || minRating !== null) && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
              )}
            </button>
          </div>

          {/* Right Controls: Sort & Grid/List View Mode Switcher */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                aria-label="Sort services"
                onChange={(e) => onSortChange(e.target.value as ServiceSort)}
                className="cursor-pointer appearance-none rounded-full bg-stone-100 py-1.5 pl-7 pr-8 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-200/80 focus:outline-hidden"
              >
                <option value="popular">Popular (Rating &amp; Demand)</option>
                <option value="distance">Nearest</option>
                <option value="rating">Top Rated (★ Stars)</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="duration">Fastest Duration</option>
              </select>
              <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-stone-400" />
            </div>

            {/* View Mode Toggle: Grid vs List */}
            {onViewModeChange && (
              <div className="hidden sm:flex items-center rounded-full bg-stone-100 p-0.5">
                <button
                  type="button"
                  onClick={() => onViewModeChange('grid')}
                  title="Grid view"
                  className={`cursor-pointer rounded-full p-1.5 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange('list')}
                  title="List view"
                  className={`cursor-pointer rounded-full p-1.5 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Advanced E-Commerce Filters Drawer (Price Tiers & Rating Filter) */}
        {showAdvanced && (
          <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Price Tiers */}
            {onPriceRangeChange && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 mr-1">
                  <DollarSign className="h-3 w-3" />
                  Price:
                </span>
                {PRICE_TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => onPriceRangeChange(tier.id)}
                    className={`cursor-pointer rounded-full px-2.5 py-1 text-xs transition-colors ${
                      priceRange === tier.id
                        ? 'bg-stone-900 font-bold text-white'
                        : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            )}

            {/* Rating Filter */}
            {onMinRatingChange && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-stone-400 mr-1">
                  <Star className="h-3 w-3" />
                  Rating:
                </span>
                {RATING_TIERS.map((tier) => (
                  <button
                    key={String(tier.value)}
                    type="button"
                    onClick={() => onMinRatingChange(tier.value)}
                    className={`cursor-pointer rounded-full px-2.5 py-1 text-xs transition-colors ${
                      minRating === tier.value
                        ? 'bg-stone-900 font-bold text-white'
                        : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Row 4: Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-stone-400">Active:</span>

            {category !== 'All' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-200/80 px-2.5 py-0.5 text-xs text-stone-800">
                {category}
                <button
                  type="button"
                  onClick={() => onCategoryChange('All')}
                  className="cursor-pointer text-stone-500 hover:text-stone-950"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {organizationId && onOrganizationChange && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-200/80 px-2.5 py-0.5 text-xs text-stone-800">
                {organizations.find((o) => o.id === organizationId)?.name || 'Salon'}
                <button
                  type="button"
                  onClick={() => onOrganizationChange('')}
                  className="cursor-pointer text-stone-500 hover:text-stone-950"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {priceRange !== 'all' && onPriceRangeChange && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-200/80 px-2.5 py-0.5 text-xs text-stone-800">
                {PRICE_TIERS.find((t) => t.id === priceRange)?.label}
                <button
                  type="button"
                  onClick={() => onPriceRangeChange('all')}
                  className="cursor-pointer text-stone-500 hover:text-stone-950"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {minRating !== null && onMinRatingChange && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-200/80 px-2.5 py-0.5 text-xs text-stone-800">
                {minRating}★+
                <button
                  type="button"
                  onClick={() => onMinRatingChange(null)}
                  className="cursor-pointer text-stone-500 hover:text-stone-950"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-200/80 px-2.5 py-0.5 text-xs text-stone-800">
                &ldquo;{searchQuery}&rdquo;
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="cursor-pointer text-stone-500 hover:text-stone-950"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                className="cursor-pointer text-xs font-semibold text-amber-700 hover:text-amber-900 underline ml-1"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
