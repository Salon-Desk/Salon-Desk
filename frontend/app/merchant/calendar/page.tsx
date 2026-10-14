'use client'

import { Clock, Filter, Loader2 } from 'lucide-react'
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
  const { data: apiBookings = [], isLoading: bookingsLoading } = useGetMyOrgBookingsQuery()

  const [markShow, { isLoading: markingShow }] = useMarkBookingShowMutation()
  const [markNoShow, { isLoading: markingNoShow }] = useMarkBookingNoShowMutation()
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation()

  const [calendarDay, setCalendarDay] = useState<CalendarDay>('TODAY')
  const [selectedStylistId, setSelectedStylistId] = useState<string>('ALL')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

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
    // mapped appointmentTime is locale string; also compare against raw starts via booking id lookup
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Calendar &amp; Schedule
          </h1>
          <p className="text-slate-500 text-xs">
            {isLoading ? 'Loading…' : `${bookings.length} bookings across ${staff.length} staff`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setCalendarDay('TODAY')}
              className={`rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
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
              className={`rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
                calendarDay === 'TOMORROW'
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tomorrow
            </button>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
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
          Loading calendar…
        </div>
      ) : null}

      {!isLoading && staff.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Add staff members to see the schedule grid.
        </div>
      ) : null}

      {!isLoading && staff.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-xs">
          <div className="min-w-[850px]">
            <div
              className="grid border-slate-200/80 border-b bg-slate-50/70"
              style={{
                gridTemplateColumns: `repeat(${filteredStaff.length}, minmax(0, 1fr))`,
              }}
            >
              {filteredStaff.map((stylist) => (
                <div key={stylist.id} className="border-slate-200/80 border-r p-4 last:border-r-0">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={stylist.avatar}
                      alt={stylist.name}
                      className="h-10 w-10 rounded-full border border-slate-200 object-cover"
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

            <div
              className="grid min-h-[500px] gap-3 divide-x divide-slate-100 bg-slate-50/30 p-3"
              style={{
                gridTemplateColumns: `repeat(${filteredStaff.length}, minmax(0, 1fr))`,
              }}
            >
              {filteredStaff.map((stylist) => {
                const stylistBookings = bookings.filter((b) => {
                  const matchesStylist = !b.stylistId || b.stylistId === stylist.id
                  const matchesDay =
                    isSameDay(b.id, calendarDay) || isSameDay(b.appointmentTime, calendarDay)
                  // Prefer matching by raw API starts_at
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
                      <div className="rounded-2xl border border-slate-200/60 border-dashed p-6 text-center text-slate-400 text-xs">
                        No bookings scheduled.
                      </div>
                    ) : (
                      stylistBookings.map((b) => {
                        const isHeld = b.status === 'HELD'
                        const isCaptured = b.status === 'CAPTURED'
                        const isNoShow = b.status === 'NO_SHOW_CAPTURED'
                        const isReauth = b.status === 'REAUTHORIZED'

                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className={`group relative w-full cursor-pointer rounded-2xl border p-3.5 text-left transition-all hover:shadow-sm ${
                              isHeld
                                ? 'border-amber-200 bg-amber-50/70 hover:border-amber-300'
                                : isReauth
                                  ? 'border-sky-200 bg-sky-50/70 hover:border-sky-300'
                                  : isCaptured
                                    ? 'border-emerald-200 bg-emerald-50/70 hover:border-emerald-300'
                                    : isNoShow
                                      ? 'border-rose-200 bg-rose-50/70 hover:border-rose-300'
                                      : 'border-slate-200 bg-slate-100/60 opacity-60'
                            }`}
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
                              <span className="font-bold text-slate-800">
                                {formatUsd(b.servicePrice)}
                              </span>
                              <span className="font-mono text-amber-800 font-medium">
                                Hold: {formatUsd(b.holdAmount)}
                              </span>
                            </div>
                          </button>
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
                toast.success('Marked show', toastColor.success)
                setSelectedBooking(null)
              })
              .catch((err) =>
                toast.error(
                  String((err as { data?: { detail?: string } })?.data?.detail || 'Failed'),
                  toastColor.error,
                ),
              )
          }
          onMarkNoShow={(b) =>
            void markNoShow(b.id)
              .unwrap()
              .then(() => {
                toast.success('No-show captured', toastColor.success)
                setSelectedBooking(null)
              })
              .catch((err) =>
                toast.error(
                  String((err as { data?: { detail?: string } })?.data?.detail || 'Failed'),
                  toastColor.error,
                ),
              )
          }
          onCancelAndVoid={(b) =>
            void cancelBooking({ bookingId: b.id, body: { reason: 'Merchant void' } })
              .unwrap()
              .then(() => {
                toast.success('Booking cancelled', toastColor.success)
                setSelectedBooking(null)
              })
              .catch((err) =>
                toast.error(
                  String((err as { data?: { detail?: string } })?.data?.detail || 'Failed'),
                  toastColor.error,
                ),
              )
          }
          onReauthorizeHold={() =>
            toast.info('Reauthorization is handled automatically by the payment honor window.')
          }
        />
      ) : null}
    </div>
  )
}
