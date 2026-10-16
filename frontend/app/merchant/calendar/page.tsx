'use client'

import { CalendarDays, Clock, Filter, Loader2, Mail, Phone, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { HoldStateBadge } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { formatUsd } from '@/lib/format'
import { mapApiBookingToUi } from '@/lib/mappers/booking'
import { useCancelBookingMutation } from '@/store/slice/bookingsApi'
import {
  useGetMyEmployeesQuery,
  useGetMyOrganizationQuery,
  useGetMyOrgBookingsQuery,
} from '@/store/slice/organizationApi'
import { useMarkBookingNoShowMutation, useMarkBookingShowMutation } from '@/store/slice/paymentsApi'
import type { Booking } from '@/types'

import { SettlementDrawer } from '../_components/settlement-drawer'

type CalendarDay = 'TODAY' | 'TOMORROW'

export default function MerchantCalendarPage() {
  const { data: org } = useGetMyOrganizationQuery()
  const { data: employees = [], isLoading: staffLoading } = useGetMyEmployeesQuery()
  const {
    data: apiBookings = [],
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useGetMyOrgBookingsQuery()

  const [markShow, { isLoading: markingShow }] = useMarkBookingShowMutation()
  const [markNoShow, { isLoading: markingNoShow }] = useMarkBookingNoShowMutation()
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation()

  const [calendarDay, setCalendarDay] = useState<CalendarDay>('TODAY')
  const [selectedStylistId, setSelectedStylistId] = useState<string>('ALL')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null)

  const bookings = useMemo(
    () => apiBookings.map((b) => mapApiBookingToUi(b, { salonName: org?.name })),
    [apiBookings, org?.name],
  )

  const staff = useMemo(
    () =>
      employees.map((e) => ({
        id: e.id,
        name: e.name || [e.first_name, e.last_name].filter(Boolean).join(' ') || e.email || 'Staff',
        role: e.role || 'stylist',
        avatar:
          e.profile?.picture ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(e.id)}`,
      })),
    [employees],
  )

  const filteredStaff =
    selectedStylistId === 'ALL' ? staff : staff.filter((s) => s.id === selectedStylistId)

  const isLoading = staffLoading || bookingsLoading
  const isSettlementProcessing = markingShow || markingNoShow || cancelling

  const isSameDay = (isoLabel: string, day: CalendarDay) => {
    const booking = apiBookings.find((b) => {
      const ui = mapApiBookingToUi(b)
      return ui.appointmentTime === isoLabel || b.id === isoLabel
    })
    const starts = booking ? new Date(booking.starts_at) : null
    if (!starts) {
      if (day === 'TODAY') return true
      return isoLabel.toLowerCase().includes('tomorrow')
    }
    const target = new Date()
    if (day === 'TOMORROW') target.setDate(target.getDate() + 1)
    return (
      starts.getFullYear() === target.getFullYear() &&
      starts.getMonth() === target.getMonth() &&
      starts.getDate() === target.getDate()
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-300">
      {/* Header section with view toggles and filters */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
              Timeline Calendar
            </h1>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-800 border border-amber-200/60">
              Live Escrow Grid
            </span>
          </div>
          <p className="text-slate-500 text-xs">
            {isLoading
              ? 'Loading…'
              : `${bookings.length} reservations across ${staff.length} stylists`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Day segmented toggle */}
          <div className="flex items-center rounded-lg border border-slate-200/80 bg-white p-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <button
              type="button"
              onClick={() => setCalendarDay('TODAY')}
              className={`rounded-md px-3.5 py-1.5 font-medium text-xs transition-all cursor-pointer ${
                calendarDay === 'TODAY'
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCalendarDay('TOMORROW')}
              className={`rounded-md px-3.5 py-1.5 font-medium text-xs transition-all cursor-pointer ${
                calendarDay === 'TOMORROW'
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Stylist filter dropdown */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedStylistId}
              onChange={(e) => setSelectedStylistId(e.target.value)}
              className="bg-transparent font-medium text-xs text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Stylists ({staff.length})</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading schedule grid…
        </div>
      ) : null}

      {!isLoading && staff.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <CalendarDays className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No staff members found</p>
          <p className="text-xs text-slate-400 mt-1">
            Add staff members to your organization to render the timeline schedule grid.
          </p>
        </div>
      ) : null}

      {!isLoading && staff.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="min-w-[850px]">
            {/* Column Headers for Stylists */}
            <div
              className="grid border-slate-200/80 border-b bg-slate-50/80"
              style={{
                gridTemplateColumns: `repeat(${filteredStaff.length}, minmax(0, 1fr))`,
              }}
            >
              {filteredStaff.map((stylist) => (
                <div
                  key={stylist.id}
                  className="border-slate-200/80 border-r p-3.5 last:border-r-0"
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={stylist.avatar}
                      alt={stylist.name}
                      className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-bold text-slate-900 text-sm">
                        {stylist.name}
                      </div>
                      <div className="truncate text-[11px] text-slate-500 capitalize">
                        {stylist.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stylist timeline lanes with compact divider lines */}
            <div
              className="grid min-h-[520px] gap-3 divide-x divide-slate-100 bg-slate-50/20 p-3.5"
              style={{
                gridTemplateColumns: `repeat(${filteredStaff.length}, minmax(0, 1fr))`,
              }}
            >
              {filteredStaff.map((stylist) => {
                const stylistBookings = bookings.filter((b) => {
                  const matchesStylist = !b.stylistId || b.stylistId === stylist.id
                  const matchesDay =
                    isSameDay(b.id, calendarDay) || isSameDay(b.appointmentTime, calendarDay)
                  const raw = apiBookings.find((ab) => ab.id === b.id)
                  let dayOk = matchesDay
                  if (raw) {
                    const starts = new Date(raw.starts_at)
                    const target = new Date()
                    if (calendarDay === 'TOMORROW') target.setDate(target.getDate() + 1)
                    dayOk =
                      starts.getFullYear() === target.getFullYear() &&
                      starts.getMonth() === target.getMonth() &&
                      starts.getDate() === target.getDate()
                  }
                  const unassigned = !b.stylistId && stylist.id === filteredStaff[0]?.id
                  return (matchesStylist || unassigned) && dayOk
                })

                return (
                  <div key={stylist.id} className="space-y-2.5">
                    {stylistBookings.length === 0 ? (
                      <div className="rounded-lg border border-slate-200/60 border-dashed p-6 text-center text-slate-400 text-xs bg-slate-50/50">
                        No bookings scheduled.
                      </div>
                    ) : (
                      stylistBookings.map((b) => {
                        const isHeld = b.status === 'HELD'
                        const isCaptured = b.status === 'CAPTURED'
                        const isNoShow = b.status === 'NO_SHOW_CAPTURED'
                        const isReauth = b.status === 'REAUTHORIZED'
                        const isHovered = hoveredBookingId === b.id

                        const borderStripClass = isHeld
                          ? 'border-l-[3.5px] border-l-amber-500 bg-amber-50/30 hover:bg-amber-50/70 border-slate-200/80 hover:border-amber-300'
                          : isReauth
                            ? 'border-l-[3.5px] border-l-sky-500 bg-sky-50/30 hover:bg-sky-50/70 border-slate-200/80 hover:border-sky-300'
                            : isCaptured
                              ? 'border-l-[3.5px] border-l-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/70 border-slate-200/80 hover:border-emerald-300'
                              : isNoShow
                                ? 'border-l-[3.5px] border-l-rose-500 bg-rose-50/30 hover:bg-rose-50/70 border-slate-200/80 hover:border-rose-300'
                                : 'border-l-[3.5px] border-l-slate-400 border-slate-200 bg-slate-100/60 opacity-60'

                        return (
                          <div
                            key={b.id}
                            className="relative"
                            onMouseEnter={() => setHoveredBookingId(b.id)}
                            onMouseLeave={() => setHoveredBookingId(null)}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(b)}
                              className={`group relative w-full cursor-pointer rounded-lg border p-3 text-left transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] ${borderStripClass}`}
                            >
                              <div className="mb-2 flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 font-semibold text-slate-800 text-xs">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  {b.appointmentTime}
                                </span>
                                <HoldStateBadge status={b.status} />
                              </div>

                              <div className="font-bold text-slate-900 text-sm">{b.clientName}</div>
                              <div className="text-slate-500 text-xs truncate">{b.serviceName}</div>

                              <div className="mt-2.5 flex items-center justify-between border-slate-200/60 border-t pt-2 text-[11px]">
                                <span className="font-bold text-slate-800 font-mono tabular-nums tracking-tight">
                                  {formatUsd(b.servicePrice)}
                                </span>
                                <span className="font-mono tabular-nums text-amber-800 font-semibold">
                                  Hold: {formatUsd(b.holdAmount)}
                                </span>
                              </div>
                            </button>

                            {/* Smooth Hover Popover with Quick Client Details */}
                            {isHovered && (
                              <div className="absolute left-1/2 -top-2 z-30 w-64 -translate-x-1/2 -translate-y-full transform rounded-xl border border-slate-800/90 bg-[#0B0F17] p-3 text-white shadow-xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                                  <span className="font-bold text-xs text-amber-400">
                                    {b.clientName}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">
                                    Ref: {b.id.slice(0, 8)}
                                  </span>
                                </div>
                                <div className="space-y-1 text-[11px] text-slate-300">
                                  {b.clientPhone && (
                                    <div className="flex items-center gap-1.5">
                                      <Phone className="h-3 w-3 text-slate-400" />
                                      <span className="font-mono">{b.clientPhone}</span>
                                    </div>
                                  )}
                                  {b.clientEmail && (
                                    <div className="flex items-center gap-1.5">
                                      <Mail className="h-3 w-3 text-slate-400" />
                                      <span className="truncate">{b.clientEmail}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 pt-1 text-slate-200 font-mono tabular-nums">
                                    <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
                                    <span>
                                      Escrow Hold: {formatUsd(b.holdAmount)} (Total:{' '}
                                      {formatUsd(b.servicePrice)})
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2 text-[10px] font-semibold text-amber-300 text-center uppercase tracking-wider">
                                  Click to open settlement sheet →
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      {selectedBooking ? (
        <SettlementDrawer
          booking={selectedBooking}
          isSettlementProcessing={isSettlementProcessing}
          onClose={() => setSelectedBooking(null)}
          onMarkShow={(b) =>
            void markShow(b.id)
              .unwrap()
              .then(() => {
                toast.success('Marked show — funds captured', toastColor.success)
                setSelectedBooking(null)
                void refetchBookings()
              })
              .catch((err) =>
                toast.error(
                  String(
                    (err as { data?: { detail?: string } })?.data?.detail || 'Failed to capture',
                  ),
                  toastColor.error,
                ),
              )
          }
          onMarkNoShow={(b) =>
            void markNoShow(b.id)
              .unwrap()
              .then(() => {
                toast.success('No-show fee captured and remainder released', toastColor.success)
                setSelectedBooking(null)
                void refetchBookings()
              })
              .catch((err) =>
                toast.error(
                  String(
                    (err as { data?: { detail?: string } })?.data?.detail ||
                      'Failed to process no-show',
                  ),
                  toastColor.error,
                ),
              )
          }
          onCancelAndVoid={(b) =>
            void cancelBooking({ bookingId: b.id, body: { reason: 'Merchant void' } })
              .unwrap()
              .then(() => {
                toast.success('Booking cancelled and hold authorization voided', toastColor.success)
                setSelectedBooking(null)
                void refetchBookings()
              })
              .catch((err) =>
                toast.error(
                  String(
                    (err as { data?: { detail?: string } })?.data?.detail ||
                      'Failed to void booking',
                  ),
                  toastColor.error,
                ),
              )
          }
          onReauthorizeHold={() =>
            toast.info(
              'Reauthorization is handled automatically by the PayPal payment honor window.',
            )
          }
        />
      ) : null}
    </div>
  )
}
