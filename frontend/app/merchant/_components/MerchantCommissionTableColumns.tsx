'use client'

import { format } from 'date-fns'
import { Copy, Eye, Percent } from 'lucide-react'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/badge/StatusBadge'
import { toastColor } from '@/constant/toast-color'
import { formatUsd } from '@/lib/format'
import type { CommissionRecord } from '@/types/api-org'
import type { ColumnDefinition } from '@/types/table'

function recordTone(status: string): 'slate' | 'amber' | 'emerald' | 'sky' {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return 'emerald'
    case 'INVOICED':
      return 'sky'
    case 'ACCRUED':
      return 'amber'
    case 'WAIVED':
      return 'slate'
    default:
      return 'slate'
  }
}

interface MerchantCommissionTableColumnsProps {
  onInspect?: (record: CommissionRecord) => void
}

export function getMerchantCommissionTableColumns(
  props?: MerchantCommissionTableColumnsProps,
): ColumnDefinition<CommissionRecord>[] {
  const onInspect = props?.onInspect

  const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
    e.stopPropagation()
    void navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`, toastColor.success)
  }

  const columns: ColumnDefinition<CommissionRecord>[] = [
    {
      id: 'status',
      header: 'Status',
      cell: (rec) => (
        <div className="flex flex-col gap-0.5">
          <StatusBadge tone={recordTone(rec.status)} size="sm">
            {rec.status}
          </StatusBadge>
          <span className="text-[10px] text-slate-400">
            {rec.status === 'ACCRUED' ? 'Uninvoiced' : rec.status}
          </span>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'Date & Time',
      cell: (rec) => {
        let dateStr = '—'
        let timeStr = ''
        try {
          const d = new Date(rec.created_at)
          dateStr = format(d, 'MMM d, yyyy')
          timeStr = format(d, 'h:mm a')
        } catch {
          dateStr = rec.created_at
        }
        return (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-800">{dateStr}</span>
            <span className="text-[11px] font-mono text-slate-400">{timeStr}</span>
          </div>
        )
      },
    },
    {
      id: 'booking_ref',
      header: 'Booking / Capture Ref',
      cell: (rec) => {
        const shortBooking = rec.booking_id ? rec.booking_id.slice(0, 8) : '—'
        const shortCapture = rec.capture_id ? rec.capture_id.slice(0, 8) : '—'
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                bkg-{shortBooking}
              </span>
              <button
                type="button"
                onClick={(e) => handleCopy(e, rec.booking_id, 'Booking reference')}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Copy full Booking ID"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-slate-400">cap-{shortCapture}</span>
              <button
                type="button"
                onClick={(e) => handleCopy(e, rec.capture_id, 'Capture ID')}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Copy PayPal Capture ID"
              >
                <Copy className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        )
      },
    },
    {
      id: 'gross',
      header: 'Gross Capture',
      cell: (rec) => {
        const gross = Number(rec.gross_captured_amount || 0)
        return (
          <div className="flex flex-col">
            <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
              {formatUsd(gross)}
            </span>
            <span className="text-[10px] text-slate-400">Direct PayPal</span>
          </div>
        )
      },
    },
    {
      id: 'rate',
      header: 'Platform Rate',
      cell: (rec) => {
        const rateJson = (rec.applied_rate_json || {}) as Record<string, unknown>
        const pct = rateJson.percentage ? Number(rateJson.percentage) : 5.0
        return (
          <div className="inline-flex items-center gap-1 rounded-md border border-amber-200/80 bg-amber-50/70 px-2 py-0.5 text-xs font-semibold text-amber-800">
            <Percent className="h-3 w-3 text-amber-600" />
            <span>{pct.toFixed(1)}%</span>
          </div>
        )
      },
    },
    {
      id: 'fee',
      header: 'Commission Fee',
      cell: (rec) => {
        const fee = Number(rec.platform_commission_amount || 0)
        return (
          <div className="flex flex-col">
            <span className="font-mono text-xs font-bold text-amber-900 tabular-nums">
              -{formatUsd(fee)}
            </span>
            <span className="text-[10px] text-amber-600/80 font-medium">SalonDesk SaaS</span>
          </div>
        )
      },
    },
    {
      id: 'net',
      header: 'Net Org Earnings',
      cell: (rec) => {
        const net = Number(rec.net_org_amount || 0)
        return (
          <div className="flex flex-col">
            <span className="font-mono text-xs font-bold text-emerald-700 tabular-nums">
              +{formatUsd(net)}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">95.0% retained</span>
          </div>
        )
      },
    },
  ]

  if (onInspect) {
    columns.push({
      id: 'detail',
      header: 'Detail',
      cell: (rec) => (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onInspect(rec)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 transition-colors cursor-pointer"
            title="View fee breakdown"
          >
            <Eye className="h-3.5 w-3.5 text-slate-400" />
            <span>Detail</span>
          </button>
        </div>
      ),
    })
  }

  return columns
}
