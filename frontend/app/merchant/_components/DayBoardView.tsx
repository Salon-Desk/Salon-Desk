'use client'

import { format } from 'date-fns'
import { CalendarClock } from 'lucide-react'

import { EmptyState } from '@/components/ui'
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

import { BookingBlock } from './BookingBlock'

interface DayBoardViewProps {
  day: Date
  events: CalendarEvent[]
  stylistId: string
  stylistName?: string
  onSelect: (event: CalendarEvent) => void
}

export function DayBoardView({ day, events, stylistId, stylistName, onSelect }: DayBoardViewProps) {
  const dayEvents = filterEventsForDay(events, day, stylistId)
  const hours = hourLabels()
  const gridHeight = (CALENDAR_DAY_END_HOUR - CALENDAR_DAY_START_HOUR) * CALENDAR_HOUR_HEIGHT_PX

  if (!stylistId || stylistId === 'ALL') {
    return (
      <EmptyState
        variant="console"
        icon={CalendarClock}
        title="Select a team member"
        description="Day board shows one stylist timeline so the schedule stays fast even with large teams."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{format(day, 'EEEE, MMM d')}</h2>
          <p className="text-xs text-slate-500">
            {stylistName || 'Stylist'} · {dayEvents.length} appointment
            {dayEvents.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="relative flex max-h-[min(70vh,720px)] overflow-y-auto">
        <div className="sticky left-0 z-10 w-14 shrink-0 border-r border-slate-100 bg-slate-50/80">
          {hours.map((hour) => (
            <div
              key={hour}
              className="border-b border-slate-100/80 px-1.5 pt-1 text-[10px] font-medium text-slate-400"
              style={{ height: CALENDAR_HOUR_HEIGHT_PX }}
            >
              {formatHourLabel(hour)}
            </div>
          ))}
        </div>

        <div className="relative min-w-0 flex-1" style={{ height: gridHeight }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="border-b border-slate-100"
              style={{ height: CALENDAR_HOUR_HEIGHT_PX }}
            />
          ))}

          {dayEvents.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded-lg bg-white/90 px-3 py-2 text-xs text-slate-400 ring-1 ring-slate-200/70">
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
      </div>
    </div>
  )
}
