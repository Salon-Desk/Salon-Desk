import { CheckCircle2, Clock, Copy, ShieldCheck } from 'lucide-react'

import PrimaryButton from '@/components/button/PrimaryButton'
import { type Column, HoldStateBadge } from '@/components/ui'
import { formatUsd } from '@/lib/format'
import type { Booking } from '@/types'

interface BookingTableColumnsProps {
  onCopy: (id: string, text: string) => void
  copiedId: string | null
  onInspectConsent: (booking: Booking) => void
  onSettle: (booking: Booking) => void
}

export function getBookingTableColumns({
  onCopy,
  copiedId,
  onInspectConsent,
  onSettle,
}: BookingTableColumnsProps): Column<Booking>[] {
  return [
    {
      key: 'id',
      header: 'Booking Ref',
      cell: (b) => (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center font-mono text-sm font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {b.id.slice(0, 8)}
          </span>
          <button
            type="button"
            onClick={() => onCopy(b.id, b.id)}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-md hover:bg-slate-100"
            title="Copy reference"
          >
            {copiedId === b.id ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client Details',
      cell: (b) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-900 text-sm">{b.clientName}</div>
          <div className="font-mono text-xs text-slate-500">{b.clientPhone || '—'}</div>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service & Stylist',
      cell: (b) => (
        <div className="space-y-0.5">
          <div className="font-medium text-slate-900 text-sm">{b.serviceName}</div>
          <div className="text-xs text-slate-500">{b.stylistName}</div>
        </div>
      ),
    },
    {
      key: 'slot',
      header: 'Appointment Time',
      cell: (b) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-700 text-sm">{b.appointmentTime}</span>
        </div>
      ),
    },
    {
      key: 'hold',
      header: 'Financials',
      cell: (b) => (
        <div className="space-y-1">
          <div className="font-bold text-slate-900 text-sm font-mono tabular-nums tracking-tight">
            {formatUsd(b.servicePrice)}
          </div>
          <div className="text-xs text-amber-700 font-mono tabular-nums font-semibold bg-amber-50 px-2 py-0.5 rounded-md inline-block">
            Hold: {formatUsd(b.holdAmount)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Escrow Status',
      cell: (b) => <HoldStateBadge status={b.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (b) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onInspectConsent(b)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm"
            title="Inspect Authorization Receipt"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </button>
          <PrimaryButton
            title="Settle"
            size="sm"
            fullWidth={false}
            className="h-9 rounded-lg px-4 text-sm font-semibold shadow-sm"
            onClick={() => onSettle(b)}
          />
        </div>
      ),
    },
  ]
}
