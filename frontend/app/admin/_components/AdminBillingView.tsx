'use client'

import { Percent } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { PageHeader } from '@/components/ui'
import { useAdminSession } from '@/hooks/use-admin-session'
import { ROUTES } from '@/lib/constants'

import { CommissionInvoicesPanel } from './CommissionInvoicesPanel'

export function AdminBillingView() {
  const { skipAdminApi } = useAdminSession()

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <PageHeader
        eyebrow="Platform Monetization · Periodic SaaS Invoicing"
        title="SaaS Commission Invoicing"
        description="Generate, issue, and reconcile periodic platform fee invoices to salon organizations. Client captures settle 100% to salon PayPal merchant accounts; SalonDesk bills its take-rate fee here."
        actions={
          <Link
            href={ROUTES.adminCommission}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-700 text-xs shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.94]"
          >
            <Percent className="h-3.5 w-3.5 text-amber-700" />
            <span>Take-Rate Matrix</span>
          </Link>
        }
      />

      <CommissionInvoicesPanel skip={skipAdminApi} />
    </div>
  )
}
