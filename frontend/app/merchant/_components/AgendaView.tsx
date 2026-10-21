'use client'

import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'

import { EmptyState } from '@/components/ui'
import type { CalendarEvent } from '@/lib/util/calendar'

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
      {[...grouped.entries()].map(([key, dayEvents]) => (
        <section key={key} className="space-y-2.5">
          <h2 className="sticky top-14 z-10 bg-slate-50/90 px-0.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 backdrop-blur-sm">
            {format(dayEvents[0].startsAt, 'EEEE, MMM d')}
            <span className="ml-2 font-mono font-semibold text-slate-400">{dayEvents.length}</span>
          </h2>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <BookingBlock key={event.booking.id} event={event} onSelect={onSelect} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
