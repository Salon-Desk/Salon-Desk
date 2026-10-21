'use client'

import { Calendar, Clock, ShieldCheck, Sparkles } from 'lucide-react'
import React from 'react'

export function ClientCatalogHighlights() {
  return (
    <div className="mb-10 sm:mb-14 overflow-hidden rounded-3xl border border-stone-200/80 bg-white/95 shadow-xs backdrop-blur-xl">
      <div className="grid grid-cols-2 divide-y divide-stone-100 sm:grid-cols-4 sm:divide-y-0 sm:divide-x sm:divide-stone-100">
        <div className="flex items-center gap-3 p-3.5 sm:p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-2xs">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-xs text-stone-900">$0 Debited Today</p>
            <p className="truncate text-[11px] text-stone-500">PayPal auth hold guarantee</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 sm:p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 shadow-2xs">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-xs text-stone-900">Verified Salons</p>
            <p className="truncate text-[11px] text-stone-500">Licensed studio specialists</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 sm:p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 shadow-2xs">
            <Calendar className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-xs text-stone-900">Instant Confirm</p>
            <p className="truncate text-[11px] text-stone-500">Real-time schedule lock</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 sm:p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 shadow-2xs">
            <Clock className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-xs text-stone-900">Free Cancellation</p>
            <p className="truncate text-[11px] text-stone-500">100% hold release window</p>
          </div>
        </div>
      </div>
    </div>
  )
}
