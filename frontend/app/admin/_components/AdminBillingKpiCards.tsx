'use client'

import { CheckCircle2, Clock, FileText, Receipt } from 'lucide-react'
import React, { useMemo } from 'react'

import { StatCard } from '@/components/card'
import { formatUsd } from '@/lib/format'
import type { OrgCommissionInvoice } from '@/types/api-org'

interface AdminBillingKpiCardsProps {
  invoices: OrgCommissionInvoice[]
}

export function AdminBillingKpiCards({ invoices }: AdminBillingKpiCardsProps) {
  const stats = useMemo(() => {
    let totalBilled = 0
    let paidAmount = 0
    let paidCount = 0
    let outstandingAmount = 0
    let outstandingCount = 0
    let draftCount = 0
    let draftAmount = 0

    invoices.forEach((inv) => {
      const amount = Number(inv.total_commission_due || 0)
      const st = (inv.status || '').toUpperCase()

      if (st !== 'VOID') {
        totalBilled += amount
      }

      if (st === 'PAID') {
        paidAmount += amount
        paidCount += 1
      } else if (st === 'ISSUED') {
        outstandingAmount += amount
        outstandingCount += 1
      } else if (st === 'DRAFT') {
        draftCount += 1
        draftAmount += amount
      }
    })

    const collectionRate = totalBilled > 0 ? Math.round((paidAmount / totalBilled) * 100) : 0

    return {
      totalBilled,
      totalCount: invoices.length,
      paidAmount,
      paidCount,
      outstandingAmount,
      outstandingCount,
      draftCount,
      draftAmount,
      collectionRate,
    }
  }, [invoices])

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <StatCard
        label="Total Commission Billed"
        value={formatUsd(stats.totalBilled)}
        footnote={`${stats.totalCount} total ${stats.totalCount === 1 ? 'invoice' : 'invoices'}`}
        icon={Receipt}
        tone="amber"
        className="hover:border-amber-200 hover:shadow-xs transition-all"
      />

      <StatCard
        label="Collected / Paid"
        value={formatUsd(stats.paidAmount)}
        footnote={`${stats.paidCount} settled (${stats.collectionRate}% collected)`}
        icon={CheckCircle2}
        tone="emerald"
        className="hover:border-emerald-200 hover:shadow-xs transition-all"
      />

      <StatCard
        label="Outstanding / Issued"
        value={formatUsd(stats.outstandingAmount)}
        footnote={`${stats.outstandingCount} awaiting salon settlement`}
        icon={Clock}
        tone={stats.outstandingCount > 0 ? 'sky' : 'slate'}
        className="hover:border-sky-200 hover:shadow-xs transition-all"
      />

      <StatCard
        label="Draft Invoices"
        value={String(stats.draftCount)}
        footnote={
          stats.draftCount > 0
            ? `${formatUsd(stats.draftAmount)} pending issuance`
            : 'All drafts issued'
        }
        icon={FileText}
        tone={stats.draftCount > 0 ? 'amber' : 'slate'}
        className="hover:border-amber-200 hover:shadow-xs transition-all"
      />
    </div>
  )
}
