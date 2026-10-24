import type { DayKey, WorkingHoursMap } from '@/types/api-org'

/** Formats a 24-hour time string ("14:30") into a human-friendly 12-hour string ("2:30 PM"). */
export function formatTime12(time24: string): string {
  if (!time24 || typeof time24 !== 'string') return ''
  const [hStr, mStr] = time24.split(':')
  const h = parseInt(hStr || '0', 10)
  const m = parseInt(mStr || '0', 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

/** Formats a time window pair (["09:00", "17:00"]) into "9:00 AM – 5:00 PM". */
export function formatWindow(start24: string, end24: string): string {
  return `${formatTime12(start24)} – ${formatTime12(end24)}`
}

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

/** Gets the 3-letter DayKey ('mon'..'sun') for a given date in an optional IANA timezone. */
export function getDayKey(date: Date = new Date(), timeZone?: string | null): DayKey {
  if (timeZone) {
    try {
      const weekdayStr = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        timeZone,
      })
        .format(date)
        .toLowerCase()
      const match = DAY_KEYS.find((k) => weekdayStr.startsWith(k))
      if (match) return match
    } catch {
      // Fallback to local
    }
  }
  return DAY_KEYS[date.getDay()] ?? 'mon'
}

/** Determines whether the salon is currently open based on operating hours and salon timezone. */
export function isSalonOpenNow(
  workingHours: WorkingHoursMap | undefined | null,
  timeZone?: string | null,
): { isOpen: boolean; nextStatus: string } {
  if (!workingHours) {
    return { isOpen: false, nextStatus: 'Hours not available' }
  }

  const now = new Date()
  const currentDayKey = getDayKey(now, timeZone)
  const todayWindows = workingHours[currentDayKey] || []

  if (!todayWindows || todayWindows.length === 0) {
    return { isOpen: false, nextStatus: 'Closed today' }
  }

  let nowMin: number
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
        timeZone,
      }).formatToParts(now)
      const h = Number(parts.find((p) => p.type === 'hour')?.value ?? now.getHours())
      const m = Number(parts.find((p) => p.type === 'minute')?.value ?? now.getMinutes())
      nowMin = h * 60 + m
    } catch {
      nowMin = now.getHours() * 60 + now.getMinutes()
    }
  } else {
    nowMin = now.getHours() * 60 + now.getMinutes()
  }

  for (const [start, end] of todayWindows) {
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const startMin = (sh ?? 0) * 60 + (sm ?? 0)
    const endMin = (eh ?? 0) * 60 + (em ?? 0)

    if (nowMin >= startMin && nowMin < endMin) {
      return { isOpen: true, nextStatus: `Open until ${formatTime12(end)}` }
    }
    if (nowMin < startMin) {
      return { isOpen: false, nextStatus: `Opens today at ${formatTime12(start)}` }
    }
  }

  return { isOpen: false, nextStatus: 'Closed for the day' }
}

/** Calculates duration between two 24h strings in minutes. Returns 0 if invalid or end <= start. */
export function calculateIntervalMinutes(start24: string, end24: string): number {
  if (!start24 || !end24) return 0
  const [sh, sm] = start24.split(':').map(Number)
  const [eh, em] = end24.split(':').map(Number)
  const startMin = (sh ?? 0) * 60 + (sm ?? 0)
  const endMin = (eh ?? 0) * 60 + (em ?? 0)
  if (endMin <= startMin) return 0
  return endMin - startMin
}

/** Formats duration between start and end into a concise string, e.g. "9h" or "8h 30m". */
export function formatIntervalDuration(start24: string, end24: string): string {
  const mins = calculateIntervalMinutes(start24, end24)
  if (mins <= 0) return ''
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  if (remainingMins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMins}m`
}

/** Computes weekly operating statistics (total operating hours and active days count). */
export function calculateWeeklyStats(schedule: WorkingHoursMap | undefined | null): {
  totalHoursFormatted: string
  openDaysCount: number
} {
  if (!schedule) {
    return { totalHoursFormatted: '0 hrs', openDaysCount: 0 }
  }
  let totalMinutes = 0
  let openDaysCount = 0

  for (const day of DAY_KEYS) {
    const windows = schedule[day]
    if (Array.isArray(windows) && windows.length > 0) {
      openDaysCount += 1
      for (const [start, end] of windows) {
        totalMinutes += calculateIntervalMinutes(start, end)
      }
    }
  }

  const hours = Math.floor(totalMinutes / 60)
  const remMins = totalMinutes % 60
  const totalHoursFormatted = remMins === 0 ? `${hours} hrs` : `${hours}h ${remMins}m`

  return { totalHoursFormatted, openDaysCount }
}

/** Formats the current time in an IANA timezone for live merchant preview. */
export function formatCurrentTimeInZone(timeZone?: string | null): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
      timeZone: timeZone || undefined,
    }).format(new Date())
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date())
  }
}
