import type { DayKey, WorkingHoursMap } from '@/types/api-org'

export interface WeekdayConfig {
  key: DayKey
  label: string
  short: string
}

export const WEEKDAYS: WeekdayConfig[] = [
  { key: 'mon', label: 'Monday', short: 'Mon' },
  { key: 'tue', label: 'Tuesday', short: 'Tue' },
  { key: 'wed', label: 'Wednesday', short: 'Wed' },
  { key: 'thu', label: 'Thursday', short: 'Thu' },
  { key: 'fri', label: 'Friday', short: 'Fri' },
  { key: 'sat', label: 'Saturday', short: 'Sat' },
  { key: 'sun', label: 'Sunday', short: 'Sun' },
]

export const DAYS = WEEKDAYS

export const DEFAULT_WORKING_HOURS: WorkingHoursMap = {
  mon: [['09:00', '18:00']],
  tue: [['09:00', '18:00']],
  wed: [['09:00', '18:00']],
  thu: [['09:00', '18:00']],
  fri: [['09:00', '18:00']],
  sat: [['10:00', '16:00']],
  sun: [],
}

/** Generates standard 24-hour time options in 30-min increments (06:00 to 23:30). */
export const TIME_OPTIONS: string[] = (() => {
  const options: string[] = []
  for (let h = 6; h <= 23; h++) {
    const hh = h.toString().padStart(2, '0')
    options.push(`${hh}:00`, `${hh}:30`)
  }
  return options
})()
