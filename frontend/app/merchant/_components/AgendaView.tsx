'use client'

import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { CalendarDays } from 'lucide-react'

import { EmptyState } from '@/components/ui'
import type { CalendarEvent } from '@/lib/util/calendar'
import { cn } from '@/lib/utils'

import { BookingBlock } from './BookingBlock'

interface AgendaViewProps {
  events: CalendarEvent[]
  onSelect: (event: CalendarEvent) => void
}

export function AgendaView({ events, onSelect }: AgendaViewProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        variant="console"
        icon={CalendarDays}
        title="No appointments in this range"
        description="Bookings for the selected day and staff will appear here in chronological order."
      />
    )
  }

  const grouped = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const key = format(event.startsAt, 'yyyy-MM-dd')
    const list = grouped.get(key) ?? []
    list.push(event)
    grouped.set(key, list)
  }

  return (
    <div className="space-y-6">
      {[...grouped.entries()].map(([key, dayEvents]) => {
        const dayDate = dayEvents[0].startsAt
        const isDayToday = isToday(dayDate)
        const isDayTomorrow = isTomorrow(dayDate)
        const isDayYesterday = isYesterday(dayDate)

        return (
          <section key={key} className="space-y-2.5">
            <div
              className={cn(
                'sticky top-14 z-10 flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all',
                isDayToday
                  ? 'border-amber-300/80 bg-gradient-to-r from-amber-100/95 via-amber-50/90 to-white/95 text-amber-950 shadow-xs'
                  : 'border-slate-200/60 bg-slate-100/90 text-slate-700',
              )}
            >
              <div className="flex items-center gap-2">
                <span>{format(dayDate, 'EEEE, MMM d')}</span>
                {isDayToday && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-extrabold tracking-normal text-white shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    Today
                  </span>
                )}
                {isDayTomorrow && (
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[9px] font-bold tracking-normal text-sky-700">
                    Tomorrow
                  </span>
                )}
                {isDayYesterday && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold tracking-normal text-slate-500">
                    Yesterday
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'font-mono text-xs font-bold tracking-normal',
                  isDayToday ? 'text-amber-800' : 'text-slate-500',
                )}
              >
                {dayEvents.length} booking{dayEvents.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="space-y-2">
              {dayEvents.map((event) => (
                <BookingBlock
                  key={event.booking.id}
                  event={event}
                  onSelect={onSelect}
                  className={cn(isDayToday && 'hover:border-amber-400')}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
