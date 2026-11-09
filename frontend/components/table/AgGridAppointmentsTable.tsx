'use client'

import { AllCommunityModule, type ColDef, ModuleRegistry } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import {
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserX,
} from 'lucide-react'
import { memo, useMemo, useState } from 'react'

import { HoldStateBadge } from '@/components/badge'
import { formatUsd } from '@/lib/format'
import type { Booking } from '@/types'

// Register AG Grid Community modules once
ModuleRegistry.registerModules([AllCommunityModule])

export interface AgGridAppointmentsTableProps {
  data: Booking[]
  isLoading?: boolean
  onInspectConsent?: (b: Booking) => void
  onSettle?: (b: Booking) => void
  onMarkShow?: (b: Booking) => Promise<void>
  onMarkNoShow?: (b: Booking) => Promise<void>
  isSettlementProcessing?: boolean | ((bookingId: string) => boolean)
  onCopy?: (id: string, text: string) => void
  copiedId?: string | null
}

export const AgGridAppointmentsTable = memo(function AgGridAppointmentsTable({
  data,
  isLoading = false,
  onInspectConsent,
  onSettle,
  onMarkShow,
  onMarkNoShow,
  isSettlementProcessing,
  onCopy,
  copiedId,
}: AgGridAppointmentsTableProps) {
  const [quickFilterText, setQuickFilterText] = useState('')

  const columnDefs = useMemo<ColDef<Booking>[]>(
    () => [
      {
        field: 'id',
        headerName: 'Reference',
        width: 140,
        sortable: true,
        filter: true,
        cellRenderer: (params: { data: Booking }) => {
          const b = params.data
          if (!b) return null
          const isCopied = copiedId === b.id
          return (
            <div className="flex h-full items-center gap-1.5">
              <span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-100/90 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                #{b.id.slice(0, 8)}
              </span>
              {onCopy && (
                <button
                  type="button"
                  onClick={() => onCopy(b.id, b.id)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                  title="Copy reference ID"
                >
                  {isCopied ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          )
        },
      },
      {
        headerName: 'Client',
        width: 190,
        sortable: true,
        filter: true,
        valueGetter: (params) => params.data?.clientName || 'Guest',
        cellRenderer: (params: { data: Booking }) => {
          const b = params.data
          if (!b) return null
          const initials =
            b.clientName
              ?.split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'CL'
          return (
            <div className="flex h-full items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-700">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-slate-900">{b.clientName}</div>
                <div className="truncate font-mono text-[10px] text-slate-500">
                  {b.clientPhone || b.clientEmail || '—'}
                </div>
              </div>
            </div>
          )
        },
      },
      {
        headerName: 'Service & Stylist',
        width: 210,
        sortable: true,
        filter: true,
        valueGetter: (params) => `${params.data?.serviceName} ${params.data?.stylistName || ''}`,
        cellRenderer: (params: { data: Booking }) => {
          const b = params.data
          if (!b) return null
          return (
            <div className="flex h-full flex-col justify-center">
              <div className="truncate text-xs font-semibold text-slate-900">{b.serviceName}</div>
              <div className="truncate text-[11px] font-medium text-amber-800">
                {b.stylistName || 'Any available stylist'}
              </div>
            </div>
          )
        },
      },
      {
        headerName: 'Appointment Time',
        width: 180,
        sortable: true,
        filter: true,
        valueGetter: (params) => params.data?.appointmentTime || '',
        cellRenderer: (params: { data: Booking }) => {
          const b = params.data
          if (!b) return null
          return (
            <div className="flex h-full items-center gap-1.5 text-xs font-medium text-slate-700">
              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{b.appointmentTime}</span>
            </div>
          )
        },
      },
      {
        headerName: 'Hold & Total',
        width: 160,
        sortable: true,
        comparator: (a, b) => (Number(a) || 0) - (Number(b) || 0),
        valueGetter: (params) => params.data?.servicePrice || 0,
        cellRenderer: (params: { data: Booking }) => {
          const b = params.data
          if (!b) return null
          return (
            <div className="flex h-full flex-col justify-center">
              <div className="text-xs font-bold text-slate-900">{formatUsd(b.servicePrice)}</div>
              <div className="text-[10px] text-emerald-700 font-medium">
                Hold: {formatUsd(b.holdAmount || b.servicePrice * 0.5)} ($0 today)
              </div>
            </div>
          )
        },
      },
      {
        headerName: 'PayPal Hold State',
        width: 170,
        sortable: true,
        filter: true,
        valueGetter: (params) => params.data?.holdStatus || params.data?.status,
        cellRenderer: (params: { data: Booking }) => {
          const b = params.data
          if (!b) return null
          return (
            <div className="flex h-full items-center">
              <HoldStateBadge status={b.status} size="sm" />
            </div>
          )
        },
      },
      {
        headerName: 'Actions & Evidence',
        width: 220,
        pinned: 'right',
        cellRenderer: (params: { data: Booking }) => {
          const b = params.data
          if (!b) return null
          const isSettled =
            b.status === 'CAPTURED' ||
            b.status === 'NO_SHOW_CAPTURED' ||
            b.status === 'VOIDED' ||
            b.status === 'REFUNDED'
          const isBusy =
            typeof isSettlementProcessing === 'function'
              ? isSettlementProcessing(b.id)
              : Boolean(isSettlementProcessing)

          return (
            <div className="flex h-full items-center justify-end gap-1.5">
              {onInspectConsent && (
                <button
                  type="button"
                  onClick={() => onInspectConsent(b)}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Inspect Ed25519 Consent & Signature"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                </button>
              )}

              {onSettle && (
                <button
                  type="button"
                  onClick={() => onSettle(b)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <DollarSign className="h-3 w-3 text-slate-500" />
                  <span>{isSettled ? 'Settled' : 'Settle'}</span>
                </button>
              )}

              {!isSettled && onMarkShow && (
                <button
                  type="button"
                  onClick={() => onMarkShow(b)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  title="Mark client show & capture total"
                >
                  <UserCheck className="h-3 w-3" />
                  <span>Show</span>
                </button>
              )}

              {!isSettled && onMarkNoShow && (
                <button
                  type="button"
                  onClick={() => onMarkNoShow(b)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  title="Mark no-show & capture policy fee"
                >
                  <UserX className="h-3 w-3" />
                  <span>No-Show</span>
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [
      copiedId,
      onCopy,
      onInspectConsent,
      onSettle,
      onMarkShow,
      onMarkNoShow,
      isSettlementProcessing,
    ],
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
      {/* AG Grid Header & Sponsor Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
            <Sparkles className="h-3 w-3 text-amber-600" />
            AG Grid Community View
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {data.length} appointments loaded
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search appointments..."
            value={quickFilterText}
            onChange={(e) => setQuickFilterText(e.target.value)}
            className="h-8 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Grid container */}
      <div
        className="ag-theme-quartz w-full overflow-hidden rounded-xl border border-slate-100"
        style={{ height: 480 }}
      >
        <AgGridReact<Booking>
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 20, 50]}
          rowHeight={52}
          headerHeight={40}
          loading={isLoading}
        />
      </div>
    </div>
  )
})
