'use client'

import { format, isSameDay, isToday } from 'date-fns'
import { useMemo } from 'react'

import { type CalendarEvent, filterEventsForDay, weekDays } from '@/lib/util/calendar'
import { cn } from '@/lib/utils'
import { useGetMyOrgSettingsQuery } from '@/store/api/orgApi'
import type { DayKey, WorkingHoursMap } from '@/types/api-org'
import type { User } from '@/types/user'

import { BookingBlock } from './BookingBlock'

interface WeekBoardViewProps {
  anchor: Date
  events: CalendarEvent[]
  stylistId: string
  stylistName?: string
  employees?: User[]
  onSelect: (event: CalendarEvent) => void
  onSelectDay?: (day: Date) => void
}

const WEEKDAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function WeekBoardView({
  anchor,
  events,
  stylistId,
  stylistName,
  employees = [],
  onSelect,
  onSelectDay,
}: WeekBoardViewProps) {
  const { data: settings } = useGetMyOrgSettingsQuery()
  const workingHours = settings?.working_hours as WorkingHoursMap | undefined

  const days = useMemo(() => weekDays(anchor), [anchor])
  const isAllStaff = !stylistId || stylistId === 'ALL'

  // Total appointments across the 7 days
  const totalEventsInWeek = useMemo(() => {
    return days.reduce((sum, day) => sum + filterEventsForDay(events, day, stylistId).length, 0)
  }, [days, events, stylistId])

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-xs">
      {/* Week Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
            Week of {format(days[0], 'MMM d')} – {format(days[6], 'MMM d, yyyy')}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {stylistName || (isAllStaff ? `All Staff (${employees.length})` : 'Stylist')} ·{' '}
            {totalEventsInWeek} appointment{totalEventsInWeek === 1 ? '' : 's'}
          </p>
        </div>
        <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
          <span>Click any day header to zoom to Day view</span>
        </div>
      </div>

      {/* 7-Day Grid */}
      <div className="overflow-x-auto">
        <div className="grid min-w-[840px] grid-cols-7 divide-x divide-slate-100">
          {days.map((day) => {
            const dayEvents = filterEventsForDay(events, day, stylistId)
            const today = isToday(day)
            const isSelected = isSameDay(day, anchor)
            const weekdayKey = WEEKDAY_KEYS[day.getDay()] || 'mon'
            const dayWindows = workingHours?.[weekdayKey] || []
            const isClosed = settings && dayWindows.length === 0

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'flex min-h-[440px] flex-col transition-colors',
                  today ? 'bg-amber-50/25 border-x-2 border-amber-300/70' : 'bg-white',
                  isClosed && 'bg-slate-50/50',
                )}
              >
                {/* Day Column Header Button */}
                <button
                  type="button"
                  onClick={() => onSelectDay?.(day)}
                  title={`View ${format(day, 'EEEE, MMM d')}`}
                  className={cn(
                    'group flex w-full flex-col items-start gap-1 border-b border-slate-100 px-3 py-2.5 text-left transition-all cursor-pointer',
                    today
                      ? 'bg-amber-100/40 hover:bg-amber-100/70'
                      : isSelected
                        ? 'bg-slate-100/80 hover:bg-slate-100'
                        : 'hover:bg-slate-50',
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider',
                        today ? 'text-amber-800' : 'text-slate-400 group-hover:text-slate-700',
                      )}
                    >
                      {format(day, 'EEE')}
                    </span>
                    <div className="flex items-center gap-1">
                      {today && (
                        <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[8px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                          Today
                        </span>
                      )}
                      {isClosed && (
                        <span className="rounded-full bg-slate-200/80 px-1.5 py-0.2 text-[9px] font-semibold text-slate-600">
                          Closed
                        </span>
                      )}
                      {dayEvents.length > 0 && !today && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-500">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-transform group-hover:scale-105',
                      today
                        ? 'bg-amber-500 text-white ring-2 ring-amber-300 ring-offset-1 shadow-xs'
                        : isSelected
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-800',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </button>

                {/* Day Column Appointments List */}
                <div className="flex-1 space-y-1.5 p-1.5">
                  {dayEvents.length === 0 ? (
                    <div className="flex h-32 items-center justify-center">
                      <span className="text-[11px] text-slate-300">—</span>
                    </div>
                  ) : (
                    dayEvents.map((event) => (
                      <BookingBlock
                        key={event.booking.id}
                        event={event}
                        onSelect={onSelect}
                        compact
                        showStylist={isAllStaff}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
