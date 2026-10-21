'use client'

import { Receipt } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { useAdminSession } from '@/hooks/use-admin-session'

import { CommissionInvoicesPanel } from './CommissionInvoicesPanel'

export function AdminBillingView() {
  const { skipAdminApi } = useAdminSession()

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            SaaS Commission Billing
          </h1>
          <p className="max-w-2xl text-slate-500 text-xs">
            Generate and issue periodic commission invoices to salon organizations. Client captures
            settle 100% to the salon PayPal; SalonDesk bills its platform fee here.
          </p>
        </div>
        <Link
          href="/admin/commission"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 text-xs shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
        >
          <Receipt className="h-3.5 w-3.5 text-amber-700" />
          Manage take-rate rules
        </Link>
      </div>

      <CommissionInvoicesPanel skip={skipAdminApi} />
    </div>
  )
}
