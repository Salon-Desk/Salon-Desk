'use client'

import { format, isSameDay, isToday } from 'date-fns'
import { CalendarRange } from 'lucide-react'

import { EmptyState } from '@/components/ui'
import { type CalendarEvent, filterEventsForDay, weekDays } from '@/lib/util/calendar'
import { cn } from '@/lib/utils'
import { useGetMyOrgSettingsQuery } from '@/store/api/orgApi'
import type { DayKey, WorkingHoursMap } from '@/types/api-org'

import { BookingBlock } from './BookingBlock'

interface WeekBoardViewProps {
  anchor: Date
  events: CalendarEvent[]
  stylistId: string
  stylistName?: string
  onSelect: (event: CalendarEvent) => void
  onSelectDay?: (day: Date) => void
}

const WEEKDAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function WeekBoardView({
  anchor,
  events,
  stylistId,
  stylistName,
  onSelect,
  onSelectDay,
}: WeekBoardViewProps) {
  const { data: settings } = useGetMyOrgSettingsQuery()
  const workingHours = settings?.working_hours as WorkingHoursMap | undefined

  if (!stylistId || stylistId === 'ALL') {
    return (
      <EmptyState
        variant="console"
        icon={CalendarRange}
        title="Select a team member"
        description="Week view focuses on one stylist across seven days — built for large teams."
      />
    )
  }

  const days = weekDays(anchor)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">Week of {format(days[0], 'MMM d')}</h2>
        <p className="text-xs text-slate-500">{stylistName || 'Stylist'}</p>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[840px] grid-cols-7 divide-x divide-slate-100">
          {days.map((day) => {
            const dayEvents = filterEventsForDay(events, day, stylistId)
            const today = isToday(day)
            const weekdayKey = WEEKDAY_KEYS[day.getDay()] || 'mon'
            const dayWindows = workingHours?.[weekdayKey] || []
            const isClosed = settings && dayWindows.length === 0

            return (
              <div
                key={day.toISOString()}
                className={cn('min-h-[420px] bg-white', isClosed && 'bg-slate-50/50')}
              >
                <button
                  type="button"
                  onClick={() => onSelectDay?.(day)}
                  className={cn(
                    'flex w-full flex-col items-start gap-0.5 border-b border-slate-100 px-2.5 py-2.5 text-left transition-colors hover:bg-slate-50',
                    today && 'bg-amber-50/50',
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {format(day, 'EEE')}
                    </span>
                    {isClosed && (
                      <span className="rounded-full bg-slate-200/80 px-1.5 py-0.2 text-[9px] font-semibold text-slate-600">
                        Closed
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold',
                      today
                        ? 'bg-amber-500 text-white'
                        : isSameDay(day, anchor)
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-800',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </button>

                <div className="space-y-1.5 p-1.5">
                  {dayEvents.length === 0 ? (
                    <p className="px-1 py-6 text-center text-[10px] text-slate-300">—</p>
                  ) : (
                    dayEvents.map((event) => (
                      <BookingBlock
                        key={event.booking.id}
                        event={event}
                        onSelect={onSelect}
                        compact
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
