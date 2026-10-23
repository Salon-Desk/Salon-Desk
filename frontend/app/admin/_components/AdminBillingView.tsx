'use client'

import { Percent, Sparkles } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { useAdminSession } from '@/hooks/use-admin-session'
import { ROUTES } from '@/lib/constants'

import { CommissionInvoicesPanel } from './CommissionInvoicesPanel'

export function AdminBillingView() {
  const { skipAdminApi } = useAdminSession()

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-amber-50/25 to-amber-100/20 p-6 shadow-xs backdrop-blur-md sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-amber-200/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-900 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Platform Monetization · Periodic SaaS Invoicing</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-extrabold text-slate-900 text-2xl tracking-tight sm:text-3xl">
                SaaS Commission Invoicing
              </h1>
            </div>

            <p className="max-w-2xl text-xs text-slate-600 sm:text-sm leading-relaxed">
              Generate, issue, and reconcile periodic platform fee invoices to salon organizations.
              Client captures settle 100% to salon PayPal merchant accounts; SalonDesk bills its
              take-rate fee here.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-xs backdrop-blur-sm">
            <Link
              href={ROUTES.adminCommission}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-700 text-xs shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.94]"
            >
              <Percent className="h-3.5 w-3.5 text-amber-700" />
              <span>Take-Rate Matrix</span>
            </Link>
          </div>
        </div>
      </div>

      <CommissionInvoicesPanel skip={skipAdminApi} />
    </div>
  )
}
