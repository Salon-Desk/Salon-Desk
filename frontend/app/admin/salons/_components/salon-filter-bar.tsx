'use client'

import { RotateCcw } from 'lucide-react'

import { SearchInput } from '@/components/ui'

import type { SalonCounts, StatusFilter } from '../_types'

interface SalonFilterBarProps {
  filter: StatusFilter
  counts: SalonCounts
  searchQuery: string
  debouncedSearch: string
  totalMatching: number
  onFilterChange: (filter: StatusFilter) => void
  onSearchChange: (query: string) => void
  onResetFilters: () => void
}

const FILTER_KEYS = ['all', 'pending', 'approved', 'suspended'] as const

export function SalonFilterBar({
  filter,
  counts,
  searchQuery,
  debouncedSearch,
  totalMatching,
  onFilterChange,
  onSearchChange,
  onResetFilters,
}: SalonFilterBarProps) {
  const isFiltered = filter !== 'all' || debouncedSearch.trim().length > 0

  return (
    <div className="space-y-3">
      {/* Filter Tabs & Search Box */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_KEYS.map((key) => {
            const isActive = filter === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => onFilterChange(key)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold capitalize transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{key}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {counts[key]}
                </span>
              </button>
            )
          })}
        </div>

        <div className="w-full sm:w-80">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search salon name, description, UUID…"
            shortcut="⌘K"
            className="w-full text-xs"
          />
        </div>
      </div>

      {/* Active Filter Strip */}
      {isFiltered && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-2.5 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Active filters:</span>
            {filter !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-medium shadow-2xs">
                Status: <strong className="capitalize">{filter}</strong>
              </span>
            )}
            {debouncedSearch.trim() && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-medium shadow-2xs">
                Query: &ldquo;<strong>{debouncedSearch}</strong>&rdquo;
              </span>
            )}
            <span className="text-amber-700">· {totalMatching} matching</span>
          </div>

          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:underline cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset filters</span>
          </button>
        </div>
      )}
    </div>
  )
}
