'use client'

import { SearchInput } from '@/components/ui'
import { HOLD_STATE_FILTER_LABEL, HOLD_STATES } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { HoldState } from '@/types'

interface AppointmentsFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  filter: 'ALL' | HoldState
  onFilterChange: (filter: 'ALL' | HoldState) => void
  filterCounts: Record<string, number>
}

export function AppointmentsFilterBar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  filterCounts,
}: AppointmentsFilterBarProps) {
  const filterOptions: ('ALL' | HoldState)[] = ['ALL', ...HOLD_STATES]

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/95 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Search Input */}
      <div className="relative w-full lg:max-w-md">
        <SearchInput
          value={search}
          onChange={(q) => onSearchChange(q)}
          placeholder="Search by client, stylist, service, or ref..."
          shortcut="⌘K"
          className="w-full border-slate-200/80 bg-slate-50/70 text-xs focus:bg-white sm:text-sm"
        />
      </div>

      {/* Filter Tabs / Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-xl bg-slate-50/80 p-1 py-1.5">
        {filterOptions.map((st) => {
          const count = filterCounts[st] ?? 0
          const isActive = filter === st

          return (
            <button
              key={st}
              type="button"
              onClick={() => onFilterChange(st)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white',
              )}
            >
              <span>{st === 'ALL' ? 'All' : HOLD_STATE_FILTER_LABEL[st]}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold',
                  isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500',
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
