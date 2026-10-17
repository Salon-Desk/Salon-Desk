import { addDays, endOfDay, endOfWeek, format, isSameDay, startOfDay, startOfWeek } from 'date-fns'

import { mapApiBookingToUi } from '@/lib/mappers/booking'
import type { Booking } from '@/types'
import type { ApiBooking } from '@/types/api-booking'

export type CalendarViewMode = 'agenda' | 'day' | 'week'

export const CALENDAR_DAY_START_HOUR = 8
export const CALENDAR_DAY_END_HOUR = 20
export const CALENDAR_HOUR_HEIGHT_PX = 64

export interface CalendarEvent {
  booking: Booking
  api: ApiBooking
  startsAt: Date
  endsAt: Date
  clientPicture?: string | null
  stylistPicture?: string | null
}

export function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function rangeForView(
  view: CalendarViewMode,
  anchor: Date,
): { starts_at: string; ends_at: string } {
  if (view === 'week') {
    const start = startOfWeek(anchor, { weekStartsOn: 1 })
    const end = endOfWeek(anchor, { weekStartsOn: 1 })
    return { starts_at: start.toISOString(), ends_at: end.toISOString() }
  }
  return {
    starts_at: startOfDay(anchor).toISOString(),
    ends_at: endOfDay(anchor).toISOString(),
  }
}

export function mapApiBookingsToEvents(
  apiBookings: ApiBooking[],
  salonName?: string,
): CalendarEvent[] {
  return apiBookings.map((api) => {
    const startsAt = new Date(api.starts_at)
    const endsAt = new Date(api.ends_at)
    return {
      api,
      booking: mapApiBookingToUi(api, { salonName }),
      startsAt,
      endsAt,
      clientPicture: api.client_picture,
      stylistPicture: api.stylist_picture,
    }
  })
}

export function filterEventsForDay(
  events: CalendarEvent[],
  day: Date,
  stylistId?: string | null,
): CalendarEvent[] {
  return events
    .filter((e) => {
      if (!isSameDay(e.startsAt, day)) return false
      if (!stylistId || stylistId === 'ALL') return true
      return e.booking.stylistId === stylistId
    })
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
}

export function weekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function layoutBlockStyle(
  startsAt: Date,
  endsAt: Date,
): {
  top: number
  height: number
} {
  const startMinutes =
    startsAt.getHours() * 60 + startsAt.getMinutes() - CALENDAR_DAY_START_HOUR * 60
  const durationMinutes = Math.max(15, (endsAt.getTime() - startsAt.getTime()) / 60000)
  const clampedStart = Math.max(0, startMinutes)
  const pxPerMinute = CALENDAR_HOUR_HEIGHT_PX / 60
  return {
    top: clampedStart * pxPerMinute,
    height: Math.max(28, durationMinutes * pxPerMinute),
  }
}

export function hourLabels(): number[] {
  const hours: number[] = []
  for (let h = CALENDAR_DAY_START_HOUR; h < CALENDAR_DAY_END_HOUR; h++) {
    hours.push(h)
  }
  return hours
}

export function formatHourLabel(hour: number): string {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  return format(d, 'h a')
}
