'use client'

import { RefreshCw } from 'lucide-react'

interface SalonHeaderProps {
  totalSalons: number
  isFetching: boolean
  onRefresh: () => void
}

export function SalonHeader({ totalSalons, isFetching, onRefresh }: SalonHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight sm:text-3xl">
            Partner Salons Directory
          </h1>
          <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] font-bold text-white shadow-2xs">
            {totalSalons} Salons
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Verify, approve, and audit multi-tenant salon organizations, take-rate rules, and merchant
          credentials.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-amber-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  )
}
