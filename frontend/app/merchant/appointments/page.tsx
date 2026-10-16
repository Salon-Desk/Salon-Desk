'use client'

import { CheckCircle2, Copy, FileSpreadsheet, Loader2, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { type Column, DataTable, HoldStateBadge, SearchInput } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { formatUsd } from '@/lib/format'
import { mapApiBookingToUi } from '@/lib/mappers/booking'
import { HOLD_STATE_FILTER_LABEL, HOLD_STATES } from '@/lib/status'
import { useCancelBookingMutation } from '@/store/slice/bookingsApi'
import { useGetMyOrgBookingsQuery } from '@/store/slice/organizationApi'
import { useMarkBookingNoShowMutation, useMarkBookingShowMutation } from '@/store/slice/paymentsApi'
import type { Booking, HoldState } from '@/types'

import { ConsentModal } from '../_components/consent-modal'
import { SettlementDrawer } from '../_components/settlement-drawer'

type AppointmentFilter = 'ALL' | HoldState

export default function MerchantAppointmentsPage() {
  const { data: apiBookings = [], isLoading, isError, refetch } = useGetMyOrgBookingsQuery()
  const [markShow, { isLoading: markingShow }] = useMarkBookingShowMutation()
  const [markNoShow, { isLoading: markingNoShow }] = useMarkBookingNoShowMutation()
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation()

  const [appointmentSearch, setAppointmentSearch] = useState('')
  const [appointmentFilter, setAppointmentFilter] = useState<AppointmentFilter>('ALL')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [inspectConsentBooking, setInspectConsentBooking] = useState<Booking | null>(null)

  const bookings = useMemo(() => apiBookings.map((b) => mapApiBookingToUi(b)), [apiBookings])

  const isSettlementProcessing = markingShow || markingNoShow || cancelling

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredAppointments = useMemo(
    () =>
      bookings.filter((b) => {
        const matchesFilter = appointmentFilter === 'ALL' || b.status === appointmentFilter
        const query = appointmentSearch.toLowerCase()
        const matchesSearch =
          b.clientName.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query) ||
          b.serviceName.toLowerCase().includes(query) ||
          b.stylistName.toLowerCase().includes(query) ||
          b.status.toLowerCase().includes(query)
        return matchesFilter && matchesSearch
      }),
    [appointmentFilter, appointmentSearch, bookings],
  )

  const handleMarkShow = async (booking: Booking) => {
    try {
      await markShow(booking.id).unwrap()
      toast.success(
        `Marked show — capture started for ${booking.id.slice(0, 8)}`,
        toastColor.success,
      )
      setSelectedBooking(null)
      void refetch()
    } catch (err) {
      const message = (err as { data?: { detail?: string } })?.data?.detail || 'Could not mark show'
      toast.error(String(message), toastColor.error)
    }
  }

  const handleMarkNoShow = async (booking: Booking) => {
    try {
      await markNoShow(booking.id).unwrap()
      toast.success(`No-show fee capture started for ${booking.id.slice(0, 8)}`, toastColor.success)
      setSelectedBooking(null)
      void refetch()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not mark no-show'
      toast.error(String(message), toastColor.error)
    }
  }

  const handleCancelAndVoid = async (booking: Booking) => {
    try {
      await cancelBooking({ bookingId: booking.id, body: { reason: 'Merchant void' } }).unwrap()
      toast.success(`Booking ${booking.id.slice(0, 8)} cancelled`, toastColor.success)
      setSelectedBooking(null)
      void refetch()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not cancel booking'
      toast.error(String(message), toastColor.error)
    }
  }

  const bookingColumns: Column<Booking>[] = [
    {
      key: 'id',
      header: 'Booking Ref',
      cell: (b) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="font-semibold text-slate-800">{b.id.slice(0, 8)}</span>
          <button
            type="button"
            onClick={() => handleCopy(b.id, b.id)}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            title="Copy reference"
          >
            {copiedId === b.id ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      cell: (b) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{b.clientName}</div>
          <div className="font-mono text-[11px] text-slate-400">{b.clientPhone || '—'}</div>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service & Stylist',
      cell: (b) => (
        <div>
          <div className="font-medium text-slate-900 text-xs">{b.serviceName}</div>
          <div className="text-[11px] text-slate-500">{b.stylistName}</div>
        </div>
      ),
    },
    {
      key: 'slot',
      header: 'Time',
      cell: (b) => <span className="font-medium text-slate-700 text-xs">{b.appointmentTime}</span>,
    },
    {
      key: 'hold',
      header: 'Ticket',
      cell: (b) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{formatUsd(b.servicePrice)}</div>
          <div className="text-[11px] text-amber-800 font-mono font-medium">
            Hold: {formatUsd(b.holdAmount)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (b) => <HoldStateBadge status={b.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setInspectConsentBooking(b)}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="Inspect Authorization Receipt"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          </button>
          <PrimaryButton
            title="Settle"
            size="sm"
            fullWidth={false}
            className="h-7 rounded-xl px-3 text-xs shadow-xs"
            onClick={() => setSelectedBooking(b)}
          />
        </div>
      ),
    },
  ]

  const filterOptions: AppointmentFilter[] = ['ALL', ...HOLD_STATES]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Appointments
          </h1>
          <p className="text-slate-500 text-xs">
            {isLoading ? 'Loading…' : `${bookings.length} organization bookings`}
          </p>
        </div>

        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-xs text-white shadow-xs">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Bookings ({bookings.length})</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading appointments…
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          <p>Could not load bookings.</p>
          <PrimaryButton
            title="Retry"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="mt-3 h-9 rounded-xl px-4"
            onClick={() => void refetch()}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <SearchInput
            value={appointmentSearch}
            onChange={setAppointmentSearch}
            placeholder="Search by client, reference, or stylist..."
            className="w-full text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {filterOptions.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setAppointmentFilter(st)}
              className={`rounded-lg px-2.5 py-1 font-medium text-xs transition-all ${
                appointmentFilter === st
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All' : HOLD_STATE_FILTER_LABEL[st]}
            </button>
          ))}
        </div>
      </div>

      {!isLoading && !isError ? (
        <DataTable
          columns={bookingColumns}
          rows={filteredAppointments}
          rowKey={(b) => b.id}
          className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden"
        />
      ) : null}

      {selectedBooking ? (
        <SettlementDrawer
          booking={selectedBooking}
          isSettlementProcessing={isSettlementProcessing}
          onClose={() => setSelectedBooking(null)}
          onMarkShow={(b) => void handleMarkShow(b)}
          onMarkNoShow={(b) => void handleMarkNoShow(b)}
          onCancelAndVoid={(b) => void handleCancelAndVoid(b)}
          onReauthorizeHold={() =>
            toast.info('Reauthorization is handled automatically by the payment honor window.')
          }
        />
      ) : null}

      {inspectConsentBooking ? (
        <ConsentModal
          booking={inspectConsentBooking}
          onClose={() => setInspectConsentBooking(null)}
        />
      ) : null}
    </div>
  )
}
