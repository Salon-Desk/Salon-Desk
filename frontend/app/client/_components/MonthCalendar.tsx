'use client'

import {
  addDays,
  addMonths,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import { parseYmd, toYmd } from '@/lib/util/timezone'
import { cn } from '@/lib/utils'

export const BOOKING_WINDOW_DAYS = 90
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export interface MonthCalendarProps {
  selectedDay: string
  todayYmd: string
  onSelectDay: (ymd: string) => void
}

export function MonthCalendar({ selectedDay, todayYmd, onSelectDay }: MonthCalendarProps) {
  const selected = parseYmd(selectedDay)
  const today = parseYmd(todayYmd)
  const lastBookable = addDays(today, BOOKING_WINDOW_DAYS)
  const [month, setMonth] = useState(() => startOfMonth(selected))

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month))
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  }, [month])

  const canPrev = isAfter(month, startOfMonth(today))
  const canNext = isBefore(addMonths(month, 1), addDays(lastBookable, 1))

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-serif text-lg text-stone-950">{format(month, 'MMMM yyyy')}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canPrev}
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30 enabled:cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            disabled={!canNext}
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30 enabled:cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <span
            key={d}
            className="pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400"
          >
            {d}
          </span>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, month)
          const disabled = isBefore(day, today) || isAfter(day, lastBookable)
          const isSelected = isSameDay(day, selected)
          const isToday = isSameDay(day, today)
          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={format(day, 'EEEE, MMMM d')}
              onClick={() => onSelectDay(toYmd(day))}
              className={cn(
                'relative flex aspect-square w-full items-center justify-center rounded-xl text-sm font-medium transition-all sm:rounded-2xl',
                !inMonth && 'text-stone-300',
                inMonth &&
                  !disabled &&
                  !isSelected &&
                  'text-stone-800 hover:bg-amber-50 cursor-pointer active:scale-95',
                disabled && 'cursor-not-allowed text-stone-300 line-through decoration-stone-200',
                isSelected &&
                  'bg-stone-950 font-semibold text-white shadow-md shadow-stone-950/20 ring-2 ring-amber-300/60 ring-offset-2 cursor-pointer',
              )}
            >
              {format(day, 'd')}
              {isToday ? (
                <span
                  className={cn(
                    'absolute bottom-1.5 h-1 w-1 rounded-full',
                    isSelected ? 'bg-amber-300' : 'bg-amber-500',
                  )}
                />
              ) : null}
            </button>
          )
        })}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-stone-400">
        <span className="h-1 w-1 rounded-full bg-amber-500" />
        Today · bookable up to {BOOKING_WINDOW_DAYS} days ahead
      </p>
    </div>
  )
}
