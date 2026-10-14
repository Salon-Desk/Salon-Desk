'use client'

import { Clock } from 'lucide-react'
import { useState } from 'react'

import { HoldStateBadge } from '@/components/ui'
import { formatUsd } from '@/lib/format'
import type { Booking, StaffMember } from '@/types'

type CalendarDay = 'TODAY' | 'TOMORROW'

interface CalendarTabProps {
  staff: StaffMember[]
  bookings: Booking[]
  onSelectBooking: (booking: Booking) => void
}

export function CalendarTab({ staff, bookings, onSelectBooking }: CalendarTabProps) {
  const [calendarDay, setCalendarDay] = useState<CalendarDay>('TODAY')

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-bold text-slate-900 text-xl">Visual Appointment Schedule</h2>
          <p className="text-slate-600 text-xs">
            Hold-colored appointment timeline. Click any slot to trigger HITL settlement (Mark Show,
            Mark No-Show, or Void).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setCalendarDay('TODAY')}
              className={`rounded-lg px-3 py-1.5 font-bold text-xs transition-colors ${
                calendarDay === 'TODAY'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Today (Wed)
            </button>
            <button
              type="button"
              onClick={() => setCalendarDay('TOMORROW')}
              className={`rounded-lg px-3 py-1.5 font-bold text-xs transition-colors ${
                calendarDay === 'TOMORROW'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Tomorrow (Thu)
            </button>
          </div>

          <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] shadow-xs lg:flex">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="font-semibold text-amber-800">Active Hold</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
              <span className="font-semibold text-sky-800">Day 4+ Reauth</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="font-semibold text-emerald-800">Captured</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="font-semibold text-rose-800">No-Show Fee</span>
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-4 border-slate-200 border-b bg-slate-50">
            {staff.map((stylist) => (
              <div key={stylist.id} className="border-slate-200 border-r p-4 last:border-r-0">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stylist.avatar}
                    alt={stylist.name}
                    className="h-10 w-10 rounded-full border-2 border-amber-300 object-cover"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{stylist.name}</div>
                    <div className="text-[11px] text-slate-500">{stylist.role}</div>
                    <div className="font-mono font-semibold text-[10px] text-amber-800">
                      ★ {stylist.rating.toFixed(1)} · {stylist.workingHours}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid min-h-[500px] grid-cols-4 gap-4 divide-x divide-slate-100 bg-slate-50/30 p-4">
            {staff.map((stylist) => {
              const stylistBookings = bookings.filter(
                (b) =>
                  b.stylistId === stylist.id &&
                  (calendarDay === 'TODAY'
                    ? b.appointmentTime.includes('Today') ||
                      b.appointmentTime.includes('AM') ||
                      b.appointmentTime.includes('PM')
                    : b.appointmentTime.includes('Tomorrow')),
              )

              return (
                <div key={stylist.id} className="space-y-3">
                  {stylistBookings.length === 0 ? (
                    <div className="rounded-xl border border-slate-300 border-dashed p-8 text-center text-slate-500 text-xs">
                      No scheduled appointments for this shift.
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
                          onClick={() => onSelectBooking(b)}
                          className={`group relative w-full cursor-pointer overflow-hidden rounded-xl border p-4 text-left shadow-xs transition-all ${
                            isHeld
                              ? 'border-amber-300 bg-amber-50/80 hover:border-amber-500'
                              : isReauth
                                ? 'border-sky-300 bg-sky-50 hover:border-sky-500'
                                : isCaptured
                                  ? 'border-emerald-300 bg-emerald-50 hover:border-emerald-500'
                                  : isNoShow
                                    ? 'border-rose-300 bg-rose-50 hover:border-rose-500'
                                    : 'border-slate-200 bg-slate-100 opacity-60'
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 font-bold font-mono text-slate-900">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {b.appointmentTime}
                            </span>
                            <HoldStateBadge status={b.status} />
                          </div>

                          <div className="font-bold text-slate-900 text-sm transition-colors group-hover:text-amber-800">
                            {b.clientName}
                          </div>
                          <div className="mb-2 line-clamp-1 text-slate-600 text-xs leading-snug">
                            {b.serviceName}
                          </div>

                          <div className="flex items-center justify-between border-slate-200/80 border-t pt-2 text-[11px]">
                            <span className="font-bold font-mono text-slate-700">
                              {formatUsd(b.servicePrice)} ticket
                            </span>
                            <span className="font-mono font-semibold text-amber-800">
                              Hold: {formatUsd(b.holdAmount)}
                            </span>
                          </div>

                          {isHeld && b.honorPeriodEndsInHours ? (
                            <div className="mt-2 flex items-center gap-1 font-medium font-mono text-[10px] text-amber-800">
                              <span>⚡ Honor period ends in {b.honorPeriodEndsInHours}h</span>
                            </div>
                          ) : null}

                          {isReauth ? (
                            <div className="mt-2 flex items-center gap-1 font-medium font-mono text-[10px] text-sky-800">
                              <span>🔄 Day 4+ Reauthorized Hold</span>
                            </div>
                          ) : null}

                          {isNoShow ? (
                            <div className="mt-2 font-medium font-mono text-[10px] text-rose-800">
                              Fee: ${b.noShowFee} retained · remainder released
                            </div>
                          ) : null}
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
    </div>
  )
}
