'use client'

import { FileText, Search } from 'lucide-react'

import { Card } from '@/components/ui'
import type { ApiChangeRequest } from '@/types/api-org'

import { ChangeRequestItemCard } from './ChangeRequestItemCard'

export type ChangeRequestFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

interface ChangeRequestHistoryProps {
  changeRequests: ApiChangeRequest[]
  filteredChangeRequests: ApiChangeRequest[]
  requestFilter: ChangeRequestFilter
  searchQuery: string
  defaultOrgName?: string
  onFilterChange: (filter: ChangeRequestFilter) => void
  onSearchChange: (query: string) => void
}

const FILTER_OPTIONS: readonly ChangeRequestFilter[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED']

export function ChangeRequestHistory({
  changeRequests,
  filteredChangeRequests,
  requestFilter,
  searchQuery,
  defaultOrgName,
  onFilterChange,
  onSearchChange,
}: ChangeRequestHistoryProps) {
  return (
    <Card
      padding="lg"
      className="space-y-4 rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Change Request History</h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
              {filteredChangeRequests.length}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Audit trail of proposed payout destinations and cancellation term amendments
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start rounded-xl bg-slate-100 p-1 text-xs sm:self-auto">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onFilterChange(filter)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                requestFilter === filter
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {filter === 'ALL' ? 'All' : filter.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar if multiple items */}
      {changeRequests.length > 3 ? (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search change requests by ID, submitter, or review notes…"
            className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none"
          />
        </div>
      ) : null}

      {/* List of Change Requests */}
      <div className="space-y-3">
        {filteredChangeRequests.length === 0 ? (
          <div className="space-y-2 py-12 text-center text-xs text-slate-400">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <FileText className="h-5 w-5" />
            </div>
            <p className="font-medium text-slate-600">No change requests found</p>
            <p className="text-[11px] text-slate-400">
              {requestFilter !== 'ALL'
                ? `No requests match the "${requestFilter.toLowerCase()}" filter.`
                : 'You have not submitted any PayPal or Policy amendment requests.'}
            </p>
          </div>
        ) : (
          filteredChangeRequests.map((cr) => (
            <ChangeRequestItemCard key={cr.id} cr={cr} defaultOrgName={defaultOrgName} />
          ))
        )}
      </div>
    </Card>
  )
}
