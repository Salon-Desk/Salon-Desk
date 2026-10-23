'use client'

import { CreditCard, Sliders } from 'lucide-react'
import Link from 'next/link'

import { MerchantCommissionBilling } from '@/app/merchant/_components/MerchantCommissionBilling'

export default function MerchantBillingPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-amber-50/50 p-5 sm:p-6 shadow-2xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Direct PayPal Settlements Active</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Platform Billing & Commission Ledger
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-slate-500">
            Client payments settle 100% directly to your PayPal merchant account. SalonDesk tracks
            booking-time commission (5.0%) in your ledger, billed periodically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/merchant/settings"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <Sliders className="h-3.5 w-3.5 text-slate-500" />
            <span>Finance Settings</span>
          </Link>
          <Link
            href="/merchant/settings/paypal"
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300/80 bg-gradient-to-r from-sky-500 to-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:from-sky-600 hover:to-sky-700 transition-all"
          >
            <CreditCard className="h-3.5 w-3.5 text-white" />
            <span>PayPal Credentials</span>
          </Link>
        </div>
      </div>

      <MerchantCommissionBilling />
    </div>
  )
}
