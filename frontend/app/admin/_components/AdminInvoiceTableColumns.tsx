'use client'

import React from 'react'

import { StatusBadge } from '@/components/badge'
import { formatUsd } from '@/lib/format'
import type { OrgCommissionInvoice } from '@/types/api-org'
import type { ColumnDefinition } from '@/types/table'

function invoiceTone(status: string): 'slate' | 'amber' | 'emerald' | 'rose' | 'sky' {
  switch (status.toUpperCase()) {
    case 'PAID':
      return 'emerald'
    case 'ISSUED':
      return 'sky'
    case 'OVERDUE':
      return 'rose'
    case 'DRAFT':
      return 'slate'
    case 'VOID':
      return 'amber'
    default:
      return 'slate'
  }
}

interface InvoiceColumnOptions {
  orgNameById: Map<string, string>
}

export function getAdminInvoiceTableColumns({
  orgNameById,
}: InvoiceColumnOptions): ColumnDefinition<OrgCommissionInvoice>[] {
  return [
    {
      id: 'org',
      header: 'Organization',
      cell: (inv) => (
        <span className="font-semibold text-slate-900 text-xs">
          {orgNameById.get(inv.org_id) || inv.org_id.slice(0, 8)}
        </span>
      ),
    },
    {
      id: 'period',
      header: 'Period',
      cell: (inv) => (
        <span className="font-mono text-[11px] text-slate-600">
          {inv.period_start} → {inv.period_end}
        </span>
      ),
    },
    {
      id: 'commission',
      header: 'Commission due',
      cell: (inv) => (
        <span className="font-bold text-emerald-800 text-xs tabular-nums">
          {formatUsd(Number(inv.total_commission_due))}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (inv) => (
        <StatusBadge tone={invoiceTone(inv.status)} size="sm">
          {inv.status}
        </StatusBadge>
      ),
    },
    {
      id: 'due_date',
      header: 'Due',
      cell: (inv) => (
        <span className="font-mono text-[11px] text-slate-500">{inv.due_date || '—'}</span>
      ),
    },
  ]
}
