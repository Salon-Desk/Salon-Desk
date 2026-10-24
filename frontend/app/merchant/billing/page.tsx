'use client'

import { MerchantCommissionBilling } from '@/app/merchant/_components/MerchantCommissionBilling'

export default function MerchantBillingPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-amber-50/60 p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative">
          <span className="mb-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800">
            Finance workspace
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Platform Billing
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
            Accrued SalonDesk commission from booking-time rate snapshots, plus issued SaaS invoices
            to pay. Client captures still settle 100% to your PayPal merchant account.
          </p>
        </div>
      </div>
      <MerchantCommissionBilling />
    </div>
  )
}
