import { StatusBadge } from '@/components/badge/StatusBadge'
import PrimaryButton from '@/components/ui/primary-button'
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

interface MerchantInvoiceTableColumnsProps {
  onPay: (invoice: OrgCommissionInvoice) => void
  payingId: string | null
  isPaying: boolean
}

export function getMerchantInvoiceTableColumns({
  onPay,
  payingId,
  isPaying,
}: MerchantInvoiceTableColumnsProps): ColumnDefinition<OrgCommissionInvoice>[] {
  return [
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
      id: 'period',
      header: 'Billing Period',
      cell: (inv) => (
        <span className="font-mono text-xs text-slate-600">
          {inv.period_start} → {inv.period_end}
        </span>
      ),
    },
    {
      id: 'due_date',
      header: 'Due Date',
      cell: (inv) => <span className="text-xs text-slate-700">{inv.due_date}</span>,
    },
    {
      id: 'amount',
      header: 'Total Due',
      cell: (inv) => (
        <span className="font-bold text-emerald-800 tabular-nums font-mono text-xs">
          {formatUsd(Number(inv.total_commission_due))}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (inv) => {
        const canPay =
          inv.status?.toUpperCase() === 'ISSUED' || inv.status?.toUpperCase() === 'OVERDUE'
        if (!canPay) return null

        const isThisPaying = payingId === inv.id || isPaying

        return (
          <div className="flex justify-end">
            <PrimaryButton
              title={isThisPaying ? 'Paying…' : 'Mark paid'}
              size="sm"
              fullWidth={false}
              isDisabled={payingId === inv.id}
              className="h-8 rounded-lg px-3 text-xs"
              onClick={() => onPay(inv)}
            />
          </div>
        )
      },
    },
  ]
}
