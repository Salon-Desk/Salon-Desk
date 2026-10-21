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
  onIssue: (inv: OrgCommissionInvoice) => void
  onVoid: (inv: OrgCommissionInvoice) => void
  issuing: boolean
  voiding: boolean
}

export function getAdminInvoiceTableColumns({
  orgNameById,
  onIssue,
  onVoid,
  issuing,
  voiding,
}: InvoiceColumnOptions): ColumnDefinition<OrgCommissionInvoice>[] {
  return [
    {
      id: 'org',
      header: 'Organization',
      cell: (inv) => (
        <span className="font-medium text-slate-900 text-xs">
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
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (inv) => (
        <div className="flex items-center justify-end space-x-2">
          {inv.status?.toUpperCase() === 'DRAFT' ? (
            <button
              type="button"
              disabled={issuing}
              onClick={() => onIssue(inv)}
              className="cursor-pointer rounded-md px-2 py-1 font-semibold text-sky-700 text-xs transition-all hover:bg-sky-50 hover:text-sky-900 active:scale-[0.98] disabled:opacity-50"
            >
              Issue
            </button>
          ) : null}
          {inv.status?.toUpperCase() !== 'PAID' && inv.status?.toUpperCase() !== 'VOID' ? (
            <button
              type="button"
              disabled={voiding}
              onClick={() => onVoid(inv)}
              className="cursor-pointer rounded-md px-2 py-1 font-semibold text-rose-700 text-xs transition-all hover:bg-rose-50 hover:text-rose-900 active:scale-[0.98] disabled:opacity-50"
            >
              Void
            </button>
          ) : null}
        </div>
      ),
    },
  ]
}
