'use client'

import { MerchantCommissionBilling } from '@/app/merchant/_components/MerchantCommissionBilling'

export default function MerchantBillingPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
          Platform Billing
        </h1>
        <p className="text-slate-500 text-xs max-w-2xl">
          Accrued SalonDesk commission from booking-time rate snapshots, plus issued SaaS invoices
          to pay. Client captures still settle 100% to your PayPal merchant account.
        </p>
      </div>
      <MerchantCommissionBilling />
    </div>
  )
}
