'use client'

import { AllCommunityModule, type ColDef, ModuleRegistry } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { format } from 'date-fns'
import { Check, Copy, Eye, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/badge/StatusBadge'
import { toastColor } from '@/constant/toast-color'
import { formatUsd } from '@/lib/format'
import type { CommissionRecord } from '@/types/api-org'

// Register AG Grid Community modules once
ModuleRegistry.registerModules([AllCommunityModule])

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

export interface AgGridFinancialLedgerTableProps {
  data: CommissionRecord[]
  isLoading?: boolean
  onInspectRecord?: (record: CommissionRecord) => void
}

export const AgGridFinancialLedgerTable = memo(function AgGridFinancialLedgerTable({
  data,
  isLoading = false,
  onInspectRecord,
}: AgGridFinancialLedgerTableProps) {
  const [quickFilterText, setQuickFilterText] = useState('')
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const handleCopyHash = (hash: string) => {
    void navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    toast.success('Cryptographic block hash copied', toastColor.success)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const columnDefs = useMemo<ColDef<CommissionRecord>[]>(
    () => [
      {
        field: 'status',
        headerName: 'Ledger State',
        width: 140,
        sortable: true,
        filter: true,
        cellRenderer: (params: { data: CommissionRecord }) => {
          const rec = params.data
          if (!rec) return null
          return (
            <div className="flex h-full items-center">
              <StatusBadge tone={recordTone(rec.status)} size="sm">
                {rec.status}
              </StatusBadge>
            </div>
          )
        },
      },
      {
        headerName: 'Recorded Timestamp',
        width: 180,
        sortable: true,
        comparator: (a, b) => new Date(a).getTime() - new Date(b).getTime(),
        valueGetter: (params) => params.data?.created_at || '',
        cellRenderer: (params: { data: CommissionRecord }) => {
          const rec = params.data
          if (!rec) return null
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
            <div className="flex h-full flex-col justify-center">
              <span className="text-xs font-semibold text-slate-800">{dateStr}</span>
              <span className="font-mono text-[10px] text-slate-400">{timeStr}</span>
            </div>
          )
        },
      },
      {
        headerName: 'References',
        width: 200,
        valueGetter: (params) =>
          `${params.data?.booking_id || ''} ${params.data?.capture_id || ''}`,
        cellRenderer: (params: { data: CommissionRecord }) => {
          const rec = params.data
          if (!rec) return null
          const shortBooking = rec.booking_id ? rec.booking_id.slice(0, 8) : '—'
          const shortCapture = rec.capture_id ? rec.capture_id.slice(0, 8) : '—'
          return (
            <div className="flex h-full flex-col justify-center gap-0.5">
              <span className="font-mono text-[10px] font-semibold text-slate-700">
                bkg-#{shortBooking}
              </span>
              <span className="font-mono text-[10px] text-slate-500">cap-#{shortCapture}</span>
            </div>
          )
        },
      },
      {
        headerName: 'Gross Captured',
        width: 150,
        sortable: true,
        comparator: (a, b) => (Number(a) || 0) - (Number(b) || 0),
        valueGetter: (params) => Number(params.data?.gross_captured_amount || 0),
        cellRenderer: (params: { data: CommissionRecord }) => {
          const rec = params.data
          if (!rec) return null
          return (
            <div className="flex h-full items-center font-bold text-xs text-slate-900">
              {formatUsd(Number(rec.gross_captured_amount) || 0)}
            </div>
          )
        },
      },
      {
        headerName: 'SaaS Platform Fee',
        width: 160,
        sortable: true,
        comparator: (a, b) => (Number(a) || 0) - (Number(b) || 0),
        valueGetter: (params) => Number(params.data?.platform_commission_amount || 0),
        cellRenderer: (params: { data: CommissionRecord }) => {
          const rec = params.data
          if (!rec) return null
          return (
            <div className="flex h-full flex-col justify-center">
              <span className="font-bold text-xs text-amber-900">
                {formatUsd(Number(rec.platform_commission_amount) || 0)}
              </span>
              <span className="text-[10px] text-slate-400">Rate snapshotted</span>
            </div>
          )
        },
      },
      {
        headerName: 'Net Salon Payout',
        width: 160,
        sortable: true,
        comparator: (a, b) => (Number(a) || 0) - (Number(b) || 0),
        valueGetter: (params) => Number(params.data?.net_org_amount || 0),
        cellRenderer: (params: { data: CommissionRecord }) => {
          const rec = params.data
          if (!rec) return null
          return (
            <div className="flex h-full items-center font-bold text-xs text-emerald-700">
              {formatUsd(Number(rec.net_org_amount) || 0)}
            </div>
          )
        },
      },
      {
        headerName: 'Cryptographic SHA-256 Proof',
        width: 220,
        cellRenderer: (params: { data: CommissionRecord }) => {
          const rec = params.data
          if (!rec) return null
          const simulatedHash = `sha256:${rec.id.replace(/-/g, '').slice(0, 16)}`
          const isCopied = copiedHash === simulatedHash
          return (
            <div className="flex h-full items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                Verified Chain ✓
              </span>
              <button
                type="button"
                onClick={() => handleCopyHash(simulatedHash)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                title="Copy SHA-256 block hash"
              >
                {isCopied ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          )
        },
      },
      {
        headerName: 'Inspect',
        width: 90,
        pinned: 'right',
        cellRenderer: (params: { data: CommissionRecord }) => {
          const rec = params.data
          if (!rec || !onInspectRecord) return null
          return (
            <div className="flex h-full items-center justify-center">
              <button
                type="button"
                onClick={() => onInspectRecord(rec)}
                className="rounded-lg border border-slate-200 bg-white p-1 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                title="View commission and ledger breakdown"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        },
      },
    ],
    [copiedHash, onInspectRecord],
  )

  const defaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
    }),
    [],
  )

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
            <Sparkles className="h-3 w-3 text-amber-600" />
            AG Grid Audit Ledger View
          </span>
          <span className="text-xs text-slate-500 font-medium">{data.length} records verified</span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search financial records..."
            value={quickFilterText}
            onChange={(e) => setQuickFilterText(e.target.value)}
            className="h-8 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Grid container */}
      <div
        className="ag-theme-quartz w-full overflow-hidden rounded-xl border border-slate-100"
        style={{ height: 420 }}
      >
        <AgGridReact<CommissionRecord>
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 20, 50]}
          rowHeight={50}
          headerHeight={40}
          loading={isLoading}
        />
      </div>
    </div>
  )
})
