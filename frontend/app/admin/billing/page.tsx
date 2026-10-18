'use client'

import { Receipt } from 'lucide-react'
import Link from 'next/link'

import { useAdminSession } from '@/hooks/use-admin-session'

import { CommissionInvoicesPanel } from '../_components/commission-invoices-panel'

export default function AdminBillingPage() {
  const { skipAdminApi } = useAdminSession()

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            SaaS Commission Billing
          </h1>
          <p className="text-slate-500 text-xs max-w-2xl">
            Generate and issue periodic commission invoices to salon organizations. Client captures
            settle 100% to the salon PayPal; SalonDesk bills its platform fee here.
          </p>
        </div>
        <Link
          href="/admin/commission"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-slate-50"
        >
          <Receipt className="h-3.5 w-3.5 text-amber-700" />
          Manage take-rate rules
        </Link>
      </div>

      <CommissionInvoicesPanel skip={skipAdminApi} />
    </div>
  )
}
