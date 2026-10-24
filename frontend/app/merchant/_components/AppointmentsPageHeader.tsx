'use client'

import { Calendar, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/lib/utils'

export interface AppointmentsPageHeaderProps {
  bookingsCount: number
  isLoading: boolean
  onRefresh?: () => void
}

export function AppointmentsPageHeader({
  bookingsCount,
  isLoading,
  onRefresh,
}: AppointmentsPageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-amber-50/70 p-4 sm:p-6">
      <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="mb-2 inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800">
            Operations desk
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Appointments &amp; Settlements
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
            {isLoading
              ? 'Loading reservations…'
              : `${bookingsCount} reservations protected via $0 PayPal escrow hold rails`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/merchant/calendar"
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 text-xs font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50/40"
          >
            <Calendar className="h-3.5 w-3.5 text-amber-600" />
            <span>Calendar View</span>
          </Link>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh appointments"
              aria-label="Refresh appointments"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50/40"
            >
              <RefreshCw
                className={cn('h-3.5 w-3.5', isLoading && 'animate-spin text-amber-600')}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
