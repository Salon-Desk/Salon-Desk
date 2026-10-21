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
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="font-extrabold text-slate-900 text-2xl tracking-tight sm:text-3xl">
          Appointments &amp; Settlements
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          {isLoading
            ? 'Loading reservations…'
            : `${bookingsCount} reservations protected via $0 PayPal escrow hold rails`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/merchant/calendar"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
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
            className="inline-flex items-center justify-center rounded-xl border border-slate-200/90 bg-white p-2 text-slate-600 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin text-amber-600')} />
          </button>
        )}
      </div>
    </div>
  )
}
