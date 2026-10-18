import { SearchInput } from '@/components/ui'
import { HOLD_STATE_FILTER_LABEL, HOLD_STATES } from '@/lib/status'
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
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-lg">
        <SearchInput
          value={search}
          onChange={(q) => {
            onSearchChange(q)
          }}
          placeholder="Search client, reference, stylist, or status..."
          shortcut="⌘K"
          className="w-full text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.map((st) => {
          const count = filterCounts[st] ?? 0
          const isActive = filter === st

          return (
            <button
              key={st}
              type="button"
              onClick={() => onFilterChange(st)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>{st === 'ALL' ? 'All' : HOLD_STATE_FILTER_LABEL[st]}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-mono font-semibold ${
                  isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
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
