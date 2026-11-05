'use client'

import { addDays, format } from 'date-fns'
import {
  Calendar,
  CalendarX2,
  Check,
  ChevronRight,
  Clock,
  Globe2,
  Loader2,
  Moon,
  Sun,
  Sunrise,
  User,
  Users,
} from 'lucide-react'

import { formatDuration } from '@/lib/format'
import {
  formatHm,
  formatTimeInZone,
  hourInTimeZone,
  parseYmd,
  timeZoneAbbr,
  toYmd,
} from '@/lib/util/timezone'
import { cn } from '@/lib/utils'
import { useGetBookingAvailabilityQuery } from '@/store/api/clientApi'
import type { TimeSlot } from '@/types/api-booking'

import { MonthCalendar } from './MonthCalendar'

const DAY_PERIODS = [
  { id: 'morning', label: 'Morning', icon: Sunrise, test: (h: number) => h < 12 },
  { id: 'afternoon', label: 'Afternoon', icon: Sun, test: (h: number) => h >= 12 && h < 17 },
  { id: 'evening', label: 'Evening', icon: Moon, test: (h: number) => h >= 17 },
] as const

function groupSlots(slots: TimeSlot[], timeZone: string) {
  return DAY_PERIODS.map((period) => ({
    ...period,
    slots: slots.filter((s) => period.test(hourInTimeZone(s.starts_at, timeZone))),
  })).filter((group) => group.slots.length > 0)
}

export interface CheckoutScheduleProps {
  serviceId: string
  durationMin: number
  stylistId?: string | null
  stylistName?: string
  salonTz: string
  displayTz: string
  timezoneOptions: { value: string; label: string }[]
  onDisplayTzChange: (tz: string) => void
  todayYmd: string
  selectedDay: string
  onSelectDay: (ymd: string) => void
  startsAt: string | null
  onSelectStartsAt: (iso: string | null) => void
}

export function CheckoutSchedule({
  serviceId,
  durationMin,
  stylistId,
  stylistName,
  salonTz,
  displayTz,
  timezoneOptions,
  onDisplayTzChange,
  todayYmd,
  selectedDay,
  onSelectDay,
  startsAt,
  onSelectStartsAt,
}: CheckoutScheduleProps) {
  const {
    data: availability,
    isFetching,
    isError,
    refetch,
  } = useGetBookingAvailabilityQuery(
    {
      service_id: serviceId,
      day: selectedDay,
      stylist_id: stylistId || undefined,
      duration_minutes: durationMin > 0 ? durationMin : undefined,
    },
    { skip: !serviceId || !selectedDay },
  )

  const availableSlots = (availability?.slots ?? []).filter((s) => s.available !== false)
  const openWindows = availability?.open_windows ?? []
  const effectiveStylistName = availability?.stylist_name || stylistName || 'Any available stylist'
  const shiftWindows = availability?.shift_windows ?? []
  const salonHours =
    availability?.salon_hours && availability.salon_hours.length > 0
      ? availability.salon_hours
      : openWindows
  const simultaneousCapacity = availability?.simultaneous_capacity ?? 1
  const groups = groupSlots(availableSlots, displayTz)
  const selectedDate = parseYmd(selectedDay)
  const isClosed = !isFetching && availability && openWindows.length === 0

  const goToNextDay = () => {
    onSelectDay(toYmd(addDays(selectedDate, 1)))
    onSelectStartsAt(null)
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-200">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-stone-950">Pick a day &amp; time</h2>
          <p className="mt-1 text-sm text-stone-500">
            Select an open slot tailored to stylist shifts and salon hours.
          </p>
        </div>
        <label className="flex items-center gap-2 self-start rounded-full border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600 shadow-xs sm:self-auto">
          <Globe2 className="h-3.5 w-3.5 shrink-0 text-amber-700" />
          <span className="sr-only">Display time zone</span>
          <select
            value={displayTz}
            onChange={(e) => onDisplayTzChange(e.target.value)}
            className="max-w-[13rem] cursor-pointer bg-transparent font-medium outline-none"
          >
            {timezoneOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Schedule context badges: Stylist Shift, Service Time, Salon Hours, Simultaneous Working Capacity */}
      <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            <User className="h-3 w-3" />
            <span>Stylist &amp; Shift</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-stone-900 truncate">
            {effectiveStylistName}
          </p>
          <p className="text-[11px] text-stone-500 truncate">
            {shiftWindows.length > 0
              ? shiftWindows.map((w) => `${formatHm(w[0])}–${formatHm(w[1])}`).join(', ')
              : 'Assigned to day shift'}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            <Clock className="h-3 w-3" />
            <span>Service Time</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-stone-900">{formatDuration(durationMin)}</p>
          <p className="text-[11px] text-stone-500">Duration per slot</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            <Calendar className="h-3 w-3" />
            <span>Salon Hours</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-stone-900 truncate">
            {salonHours.length > 0
              ? salonHours.map((w) => `${formatHm(w[0])}–${formatHm(w[1])}`).join(', ')
              : 'Closed today'}
          </p>
          <p className="text-[11px] text-stone-500 truncate">{salonTz.replace(/_/g, ' ')}</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            <Users className="h-3 w-3" />
            <span>Capacity</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-stone-900">
            {simultaneousCapacity} simultaneous
          </p>
          <p className="text-[11px] text-stone-500">Concurrent stations</p>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-2">
        <div className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-5">
          <MonthCalendar
            selectedDay={selectedDay}
            todayYmd={todayYmd}
            onSelectDay={(ymd) => {
              onSelectDay(ymd)
              onSelectStartsAt(null)
            }}
          />
        </div>

        <div className="flex min-h-[320px] flex-col rounded-3xl border border-stone-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-3 gap-y-2 border-b border-stone-100 pb-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                {format(selectedDate, 'EEEE')}
              </p>
              <p className="whitespace-nowrap font-serif text-xl text-stone-950">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>
            </div>
            {openWindows.length > 0 ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {openWindows.map((w) => `${formatHm(w[0])} – ${formatHm(w[1])}`).join(', ')}
              </span>
            ) : null}
          </div>

          {isFetching ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-stone-500">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              Checking availability…
            </div>
          ) : isError ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-rose-600">
              Could not load availability.
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-full bg-stone-950 px-4 py-1.5 text-xs font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 px-6 py-8 text-center">
              <CalendarX2 className="h-7 w-7 text-stone-300" />
              <div>
                <p className="text-sm font-semibold text-stone-800">
                  {isClosed ? 'The salon is closed this day' : 'No open times left this day'}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  Try the next day or pick another date.
                </p>
              </div>
              <button
                type="button"
                onClick={goToNextDay}
                className="inline-flex items-center gap-1 rounded-full bg-stone-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800"
              >
                Next day
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="-mr-2 max-h-[22rem] space-y-5 overflow-y-auto pr-2">
              <p className="text-xs text-stone-500">
                <span className="font-semibold text-stone-800">{availableSlots.length}</span> times
                available · shown in {timeZoneAbbr(displayTz, selectedDate)}
              </p>
              {groups.map((group) => {
                const Icon = group.icon
                return (
                  <div key={group.id}>
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      <Icon className="h-3.5 w-3.5 text-amber-600" />
                      {group.label}
                      <span className="font-medium normal-case tracking-normal text-stone-300">
                        · {group.slots.length}
                      </span>
                    </p>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-2">
                      {group.slots.map((slot) => {
                        const selected = startsAt === slot.starts_at
                        return (
                          <button
                            key={slot.starts_at}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onSelectStartsAt(slot.starts_at)}
                            className={cn(
                              'relative cursor-pointer whitespace-nowrap rounded-xl border px-2 py-2.5 text-center text-xs font-semibold tabular-nums transition-all active:scale-[0.97]',
                              selected
                                ? 'border-stone-950 bg-stone-950 text-white shadow-md shadow-stone-950/15'
                                : 'border-stone-200 bg-white text-stone-700 hover:border-amber-300 hover:bg-amber-50',
                            )}
                          >
                            {formatTimeInZone(slot.starts_at, displayTz)}
                            {selected ? (
                              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-stone-950">
                                <Check className="h-2.5 w-2.5" strokeWidth={3} />
                              </span>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {startsAt && !isFetching ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                Selected{' '}
                <span className="font-semibold">
                  {formatTimeInZone(startsAt, displayTz)} –{' '}
                  {formatTimeInZone(
                    new Date(Date.parse(startsAt) + durationMin * 60_000).toISOString(),
                    displayTz,
                  )}
                </span>
                . Continue to review your booking.
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
