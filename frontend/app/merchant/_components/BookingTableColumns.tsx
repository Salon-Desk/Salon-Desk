import { CheckCircle2, Clock, Copy } from 'lucide-react'

import { HoldStateBadge } from '@/components/badge'
import { formatUsd } from '@/lib/format'
import type { Booking } from '@/types'
import type { ColumnDefinition } from '@/types/table'

interface BookingTableColumnsProps {
  onCopy: (id: string, text: string) => void
  copiedId: string | null
}

export function getBookingTableColumns({
  onCopy,
  copiedId,
}: BookingTableColumnsProps): ColumnDefinition<Booking>[] {
  return [
    {
      id: 'id',
      header: 'Reference',
      cell: (b) => {
        const isCopied = copiedId === b.id
        return (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center font-mono text-xs font-semibold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/80">
              #{b.id.slice(0, 8)}
            </span>
            <button
              type="button"
              onClick={() => onCopy(b.id, b.id)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-100 cursor-pointer"
              title="Copy booking ID"
            >
              {isCopied ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )
      },
    },
    {
      id: 'client',
      header: 'Client',
      cell: (b) => {
        const initials =
          b.clientName
            ?.split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'CL'

        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-[11px] text-slate-700 border border-slate-200">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 text-xs truncate max-w-[150px]">
                {b.clientName}
              </div>
              <div className="font-mono text-[11px] text-slate-500 truncate max-w-[150px]">
                {b.clientPhone || b.clientEmail || '—'}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      id: 'service',
      header: 'Service & Stylist',
      cell: (b) => (
        <div className="space-y-0.5">
          <div className="font-medium text-slate-900 text-xs truncate max-w-[180px]">
            {b.serviceName}
          </div>
          <div className="text-[11px] text-amber-800 font-medium truncate max-w-[180px]">
            {b.stylistName || 'Any available'}
          </div>
        </div>
      ),
    },
    {
      id: 'slot',
      header: 'Date & Time',
      cell: (b) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{b.appointmentTime}</span>
        </div>
      ),
    },
    {
      id: 'hold',
      header: 'Financials',
      cell: (b) => (
        <div className="space-y-0.5">
          <div className="font-bold text-slate-900 text-xs font-mono tabular-nums">
            {formatUsd(b.servicePrice)}
          </div>
          <div className="text-[10px] text-amber-700 font-mono font-medium">
            Hold: {formatUsd(b.holdAmount)}
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Escrow State',
      cell: (b) => <HoldStateBadge status={b.status} />,
    },
  ]
}
