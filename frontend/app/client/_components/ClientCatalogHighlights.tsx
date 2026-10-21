'use client'

import { Calendar, Clock, ShieldCheck, Sparkles } from 'lucide-react'
import React from 'react'

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    iconBg: 'bg-emerald-50 text-emerald-600',
    title: '$0 Debited Today',
    subtitle: 'PayPal auth hold guarantee',
  },
  {
    icon: Sparkles,
    iconBg: 'bg-amber-50 text-amber-600',
    title: 'Verified Salons',
    subtitle: 'Licensed studio specialists',
  },
  {
    icon: Calendar,
    iconBg: 'bg-sky-50 text-sky-600',
    title: 'Instant Confirm',
    subtitle: 'Real-time schedule lock',
  },
  {
    icon: Clock,
    iconBg: 'bg-purple-50 text-purple-600',
    title: 'Free Cancellation',
    subtitle: '100% hold release window',
  },
]

export function ClientCatalogHighlights() {
  return (
    <div className="mb-10 sm:mb-14 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs">
      <div className="grid grid-cols-2 divide-x divide-y divide-stone-100 sm:grid-cols-4 sm:divide-y-0">
        {HIGHLIGHTS.map((h) => (
          <div key={h.title} className="flex items-center gap-3 p-4 sm:p-5">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-2xs ${h.iconBg}`}
            >
              <h.icon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-stone-900">{h.title}</p>
              <p className="truncate text-[11px] leading-snug text-stone-500">{h.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
