import { format } from 'date-fns'

import { StatusBadge } from '@/components/badge'
import { formatUsd } from '@/lib/format'
import type { OrgCommissionInvoice } from '@/types/api-org'
import type { ColumnDefinition } from '@/types/table'

function invoiceTone(status: string): 'slate' | 'amber' | 'emerald' | 'rose' | 'sky' {
  switch (status?.toUpperCase()) {
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

export function getMerchantInvoiceTableColumns(): ColumnDefinition<OrgCommissionInvoice>[] {
  return [
    {
      id: 'status',
      header: 'Status',
      cell: (inv) => (
        <div className="flex flex-col gap-0.5">
          <StatusBadge tone={invoiceTone(inv.status)} size="sm">
            {inv.status}
          </StatusBadge>
          {inv.paid_at && (
            <span className="text-[10px] text-emerald-700">
              Paid {format(new Date(inv.paid_at), 'MMM d')}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'period',
      header: 'Billing Period',
      cell: (inv) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-semibold text-slate-800">
            {inv.period_start} → {inv.period_end}
          </span>
          <span className="text-[10px] text-slate-400">Monthly consolidation</span>
        </div>
      ),
    },
    {
      id: 'gross_volume',
      header: 'Total Volume',
      cell: (inv) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
            {formatUsd(Number(inv.total_gross_volume || 0))}
          </span>
          <span className="text-[10px] text-slate-400">Settled to PayPal</span>
        </div>
      ),
    },
    {
      id: 'due_date',
      header: 'Due Date',
      cell: (inv) => {
        let dateText = inv.due_date || '—'
        try {
          if (inv.due_date) {
            dateText = format(new Date(inv.due_date), 'MMM d, yyyy')
          }
        } catch {
          dateText = inv.due_date
        }
        return (
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-700">{dateText}</span>
            <span className="text-[10px] text-slate-400 font-mono">Net-15 terms</span>
          </div>
        )
      },
    },
    {
      id: 'amount',
      header: 'Commission Due',
      cell: (inv) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 tabular-nums font-mono text-xs">
            {formatUsd(Number(inv.total_commission_due))}
          </span>
          <span className="text-[10px] text-amber-700 font-medium">SalonDesk SaaS</span>
        </div>
      ),
    },
  ]
}
