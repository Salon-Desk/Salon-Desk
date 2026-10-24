'use client'

import { differenceInCalendarDays, format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { Calendar as CalendarIcon, Moon, User as UserIcon } from 'lucide-react'
import { useMemo } from 'react'

import {
  CALENDAR_DAY_END_HOUR,
  CALENDAR_DAY_START_HOUR,
  CALENDAR_HOUR_HEIGHT_PX,
  type CalendarEvent,
  filterEventsForDay,
  formatHourLabel,
  hourLabels,
  layoutBlockStyle,
} from '@/lib/util/calendar'
import { staffDisplayName, staffPicture } from '@/lib/util/staff-display'
import { cn } from '@/lib/utils'
import { useGetMyOrgSettingsQuery } from '@/store/api/orgApi'
import type { DayKey, WorkingHoursMap } from '@/types/api-org'
import type { User } from '@/types/user'

import { BookingBlock } from './BookingBlock'
import { StaffAvatar } from './StaffAvatar'

interface DayBoardViewProps {
  day: Date
  events: CalendarEvent[]
  stylistId: string
  stylistName?: string
  employees?: User[]
  onSelect: (event: CalendarEvent) => void
  onGoToday?: () => void
}

const WEEKDAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function getRelativeDayLabel(date: Date): string | null {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  if (isTomorrow(date)) return 'Tomorrow'
  const diff = differenceInCalendarDays(date, new Date())
  if (diff > 0 && diff <= 7) return `In ${diff} days`
  if (diff < 0 && diff >= -7) return `${Math.abs(diff)} days ago`
  return null
}

export function DayBoardView({
  day,
  events,
  stylistId,
  stylistName,
  employees = [],
  onSelect,
  onGoToday,
}: DayBoardViewProps) {
  const { data: settings } = useGetMyOrgSettingsQuery()
  const dayEvents = useMemo(
    () => filterEventsForDay(events, day, stylistId),
    [events, day, stylistId],
  )
  const hours = hourLabels()
  const gridHeight = (CALENDAR_DAY_END_HOUR - CALENDAR_DAY_START_HOUR) * CALENDAR_HOUR_HEIGHT_PX

  const isDayToday = isToday(day)
  const relativeLabel = getRelativeDayLabel(day)

  const weekdayKey = WEEKDAY_KEYS[day.getDay()] || 'mon'
  const workingHours = settings?.working_hours as WorkingHoursMap | undefined
  const dayWindows = workingHours?.[weekdayKey] || []
  const isClosed = settings && dayWindows.length === 0

  const isAllStaff = !stylistId || stylistId === 'ALL'

  // Calculate current time line if viewing today
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = CALENDAR_DAY_START_HOUR * 60
  const endMinutes = CALENDAR_DAY_END_HOUR * 60
  const isWithinHours = currentMinutes >= startMinutes && currentMinutes <= endMinutes
  const currentTopPx =
    isDayToday && isWithinHours
      ? ((currentMinutes - startMinutes) * CALENDAR_HOUR_HEIGHT_PX) / 60
      : null

  // Employee columns for All Staff view
  const employeeIds = useMemo(() => new Set(employees.map((e) => e.id)), [employees])
  const unassignedEvents = useMemo(
    () => (isAllStaff ? dayEvents.filter((e) => !employeeIds.has(e.booking.stylistId)) : []),
    [isAllStaff, dayEvents, employeeIds],
  )

  const activeEmployees = isAllStaff ? employees : []
  const showMultiColumns = isAllStaff && activeEmployees.length > 0

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border transition-colors bg-white shadow-xs',
        isDayToday ? 'border-amber-200/80' : 'border-slate-200/70',
      )}
    >
      {/* Day Board Header */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5',
          isDayToday
            ? 'border-amber-100 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30'
            : 'border-slate-100 bg-white',
        )}
      >
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                {format(day, 'EEEE, MMM d')}
              </h2>
              {isDayToday ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Today
                </span>
              ) : relativeLabel ? (
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {relativeLabel}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {stylistName || (isAllStaff ? 'All Staff' : 'Stylist')} · {dayEvents.length}{' '}
              appointment{dayEvents.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isDayToday && onGoToday && (
            <button
              type="button"
              onClick={onGoToday}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-300/80 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 transition-all hover:bg-amber-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-amber-600" />
              <span>Return to Today</span>
            </button>
          )}

          {isClosed && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              <Moon className="h-3.5 w-3.5 text-slate-400" />
              <span>Salon Closed on this day</span>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Canvas */}
      <div className="relative flex max-h-[min(75vh,760px)] overflow-auto">
        {/* Sticky Left Hour Axis */}
        <div className="sticky left-0 z-30 w-16 shrink-0 border-r border-slate-200/80 bg-slate-50/95 backdrop-blur-sm">
          {/* Header spacer to match stylist column headers */}
          {showMultiColumns && (
            <div className="h-12 border-b border-slate-200/80 bg-slate-100/60" />
          )}
          {hours.map((hour) => (
            <div
              key={hour}
              className="border-b border-slate-100/90 px-2 pt-1 text-[11px] font-medium text-slate-400"
              style={{ height: CALENDAR_HOUR_HEIGHT_PX }}
            >
              {formatHourLabel(hour)}
            </div>
          ))}
        </div>

        {/* Multi-Stylist Columns Mode */}
        {showMultiColumns ? (
          <div className="relative flex min-w-0 flex-1 divide-x divide-slate-100">
            {/* Real-time Now line across all columns */}
            {currentTopPx !== null && (
              <div
                className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                style={{ top: currentTopPx + 48 }}
              >
                <div className="flex h-3.5 items-center rounded-r bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
                  Now
                </div>
                <div className="h-[2px] flex-1 bg-rose-500/80 shadow-xs" />
              </div>
            )}

            {activeEmployees.map((emp) => {
              const empEvents = dayEvents.filter((e) => e.booking.stylistId === emp.id)
              const name = staffDisplayName(emp)
              const picture = staffPicture(emp)

              return (
                <div
                  key={emp.id}
                  className="flex min-w-[210px] flex-1 flex-col bg-white transition-colors"
                >
                  {/* Stylist Column Header */}
                  <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-200/80 bg-slate-50/95 px-3 py-2 backdrop-blur-sm">
                    <StaffAvatar name={name} picture={picture} seed={emp.id} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-slate-900">{name}</div>
                      <div className="truncate text-[10px] text-slate-500">
                        {empEvents.length} booking{empEvents.length === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>

                  {/* Stylist Timeline */}
                  <div className="relative flex-1" style={{ height: gridHeight }}>
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="border-b border-slate-100"
                        style={{ height: CALENDAR_HOUR_HEIGHT_PX }}
                      />
                    ))}

                    {empEvents.map((event) => {
                      const style = layoutBlockStyle(event.startsAt, event.endsAt)
                      return (
                        <BookingBlock
                          key={event.booking.id}
                          event={event}
                          onSelect={onSelect}
                          compact
                          absolute={style}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Unassigned column if any events have no assigned stylist */}
            {unassignedEvents.length > 0 && (
              <div className="flex min-w-[210px] flex-1 flex-col bg-slate-50/30">
                <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-200/80 bg-slate-100/90 px-3 py-2 backdrop-blur-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                    <UserIcon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-slate-800">Unassigned</div>
                    <div className="truncate text-[10px] text-slate-500">
                      {unassignedEvents.length} booking{unassignedEvents.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>
                <div className="relative flex-1" style={{ height: gridHeight }}>
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="border-b border-slate-100"
                      style={{ height: CALENDAR_HOUR_HEIGHT_PX }}
                    />
                  ))}
                  {unassignedEvents.map((event) => {
                    const style = layoutBlockStyle(event.startsAt, event.endsAt)
                    return (
                      <BookingBlock
                        key={event.booking.id}
                        event={event}
                        onSelect={onSelect}
                        compact
                        absolute={style}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Single Stylist / Fallback Column Mode */
          <div className="relative min-w-0 flex-1" style={{ height: gridHeight }}>
            {/* Real-time Now line */}
            {currentTopPx !== null && (
              <div
                className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                style={{ top: currentTopPx }}
              >
                <div className="flex h-3.5 items-center rounded-r bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
                  Now
                </div>
                <div className="h-[2px] flex-1 bg-rose-500/80 shadow-xs" />
              </div>
            )}

            {hours.map((hour) => (
              <div
                key={hour}
                className="border-b border-slate-100"
                style={{ height: CALENDAR_HOUR_HEIGHT_PX }}
              />
            ))}

            {dayEvents.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="rounded-xl border border-slate-200/80 bg-white/95 px-4 py-2.5 text-xs font-medium text-slate-400 shadow-xs">
                  No bookings on this day
                </p>
              </div>
            ) : (
              dayEvents.map((event) => {
                const style = layoutBlockStyle(event.startsAt, event.endsAt)
                return (
                  <BookingBlock
                    key={event.booking.id}
                    event={event}
                    onSelect={onSelect}
                    compact
                    absolute={style}
                  />
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
