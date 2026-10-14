'use client'

import { Activity, KeyRound } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  Button,
  Card,
  type Column,
  DataTable,
  HoldStateBadge,
  LedgerActionBadge,
  SearchInput,
} from '@/components/ui'
import { formatUsd } from '@/lib/format'
import { HOLD_STATE_FILTER_LABEL, HOLD_STATES } from '@/lib/status'
import type { AuditLedgerEntry, Booking, HoldState } from '@/types'

type AppointmentFilter = 'ALL' | HoldState

interface AppointmentsTabProps {
  bookings: Booking[]
  auditLedger: AuditLedgerEntry[]
  onSelectBooking: (booking: Booking) => void
  onInspectConsent: (booking: Booking) => void
}

export function AppointmentsTab({
  bookings,
  auditLedger,
  onSelectBooking,
  onInspectConsent,
}: AppointmentsTabProps) {
  const [appointmentSearch, setAppointmentSearch] = useState('')
  const [appointmentFilter, setAppointmentFilter] = useState<AppointmentFilter>('ALL')

  const filteredAppointments = useMemo(
    () =>
      bookings.filter((b) => {
        const matchesFilter = appointmentFilter === 'ALL' || b.status === appointmentFilter
        const query = appointmentSearch.toLowerCase()
        const matchesSearch =
          b.clientName.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query) ||
          b.serviceName.toLowerCase().includes(query) ||
          b.stylistName.toLowerCase().includes(query)
        return matchesFilter && matchesSearch
      }),
    [appointmentFilter, appointmentSearch, bookings],
  )

  const bookingColumns: Column<Booking>[] = [
    {
      key: 'id',
      header: 'Booking Ref',
      cell: (b) => <span className="font-bold font-mono text-amber-700">{b.id}</span>,
    },
    {
      key: 'client',
      header: 'Client & Contact',
      cell: (b) => (
        <div>
          <div className="font-bold text-slate-900">{b.clientName}</div>
          <div className="font-mono text-[11px] text-slate-500">{b.clientPhone}</div>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service & Stylist',
      cell: (b) => (
        <div>
          <div className="font-medium text-slate-900">{b.serviceName}</div>
          <div className="font-mono font-semibold text-[11px] text-amber-800">
            Stylist: {b.stylistName}
          </div>
        </div>
      ),
    },
    {
      key: 'slot',
      header: 'Scheduled Slot',
      cell: (b) => <span className="text-slate-700">{b.appointmentTime}</span>,
    },
    {
      key: 'hold',
      header: 'Hold Amount',
      cell: (b) => (
        <div className="font-mono">
          <div className="font-bold text-slate-900">{formatUsd(b.servicePrice)}</div>
          <div className="text-[11px] text-amber-800">Hold: {formatUsd(b.holdAmount)}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (b) => <HoldStateBadge status={b.status} />,
    },
    {
      key: 'consent',
      header: 'Consent Receipt',
      cell: (b) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onInspectConsent(b)}
          className="font-mono text-[11px]"
        >
          <KeyRound className="h-3 w-3 text-amber-600" />
          Inspect Hash
        </Button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (b) => (
        <Button variant="secondary" size="sm" onClick={() => onSelectBooking(b)}>
          Settle / Details →
        </Button>
      ),
    },
  ]

  const ledgerColumns: Column<AuditLedgerEntry>[] = [
    {
      key: 'id',
      header: 'Ledger ID',
      cell: (entry) => <span className="font-bold text-amber-700">{entry.id}</span>,
    },
    {
      key: 'booking',
      header: 'Booking Ref',
      cell: (entry) => <span className="text-slate-600">{entry.bookingId}</span>,
    },
    {
      key: 'client',
      header: 'Client',
      cell: (entry) => (
        <span className="font-medium font-sans text-slate-900">{entry.clientName}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      cell: (entry) => <LedgerActionBadge action={entry.action} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (entry) => <span className="font-bold text-slate-900">{formatUsd(entry.amount)}</span>,
    },
    {
      key: 'debug',
      header: 'PayPal Debug ID',
      cell: (entry) => <span className="text-[11px] text-slate-500">{entry.paypalDebugId}</span>,
    },
    {
      key: 'time',
      header: 'Timestamp',
      cell: (entry) => (
        <span className="font-sans text-[11px] text-slate-500">{entry.timestamp}</span>
      ),
    },
  ]

  const filterOptions: AppointmentFilter[] = ['ALL', ...HOLD_STATES]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-bold text-slate-900 text-xl">Appointments &amp; Audit Ledger</h2>
          <p className="text-slate-600 text-xs">
            Real-time transaction table with server-signed Ed25519 consent receipts, sha256 hashes,
            and PayPal debug IDs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SearchInput
            value={appointmentSearch}
            onChange={setAppointmentSearch}
            placeholder="Search client, ID, service..."
            className="min-w-[220px]"
          />

          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
            {filterOptions.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setAppointmentFilter(st)}
                className={`rounded px-2.5 py-1 font-semibold text-[11px] transition-colors ${
                  appointmentFilter === st
                    ? 'border border-amber-300 bg-amber-100 text-amber-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All' : HOLD_STATE_FILTER_LABEL[st]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable columns={bookingColumns} rows={filteredAppointments} rowKey={(b) => b.id} />

      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Cryptographic Audit Ledger (PayPal Orders v2)
            </h3>
          </div>
          <span className="flex items-center gap-1 font-bold font-mono text-[10px] text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            100% Webhook Verified
          </span>
        </div>

        <DataTable
          columns={ledgerColumns}
          rows={auditLedger}
          rowKey={(entry) => entry.id}
          mono
          className="rounded-xl shadow-none"
        />
      </Card>
    </div>
  )
}
