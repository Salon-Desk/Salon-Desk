/** Calendar-day and wall-clock helpers for rendering appointment times in an IANA time zone. */

export function browserTimeZone(): string {
  if (typeof Intl === 'undefined') return 'UTC'
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

export function ymdInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Local-midnight `Date` for a `YYYY-MM-DD` key (no time zone shift). */
export function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function hourInTimeZone(iso: string, timeZone: string): number {
  const hour = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hourCycle: 'h23',
    timeZone,
  }).format(new Date(iso))
  return Number(hour) % 24
}

export function formatTimeInZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso))
}

export function formatDateInZone(
  iso: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' },
): string {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone }).format(new Date(iso))
}

/** Short zone label such as `CDT` or `GMT+3`. */
export function timeZoneAbbr(timeZone: string, at: Date = new Date()): string {
  const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
    .formatToParts(at)
    .find((p) => p.type === 'timeZoneName')
  return part?.value ?? timeZone
}

/** `"09:00"` → `"9:00 AM"`. */
export function formatHm(hm: string): string {
  const [h, m] = hm.split(':').map(Number)
  if (!Number.isFinite(h)) return hm
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${suffix}`
}
