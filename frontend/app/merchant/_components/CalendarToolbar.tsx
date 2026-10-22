'use client'

import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  format,
  isToday,
  isTomorrow,
  isYesterday,
  subDays,
  subWeeks,
} from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { CalendarViewMode } from '@/lib/util/calendar'
import { cn } from '@/lib/utils'
import type { User } from '@/types/user'

import { StaffPicker } from './StaffPicker'

const VIEWS: { id: CalendarViewMode; label: string }[] = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
]

function getRelativeDayLabel(date: Date): string | null {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  if (isTomorrow(date)) return 'Tomorrow'
  const diff = differenceInCalendarDays(date, new Date())
  if (diff > 0 && diff <= 7) return `In ${diff} days`
  if (diff < 0 && diff >= -7) return `${Math.abs(diff)} days ago`
  return null
}

interface CalendarToolbarProps {
  view: CalendarViewMode
  onViewChange: (view: CalendarViewMode) => void
  anchor: Date
  onAnchorChange: (date: Date) => void
  employees: User[]
  staffId: string
  onStaffChange: (id: string, employee?: User) => void
  bookingCount: number
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function CalendarToolbar({
  view,
  onViewChange,
  anchor,
  onAnchorChange,
  employees,
  staffId,
  onStaffChange,
  bookingCount,
  onRefresh,
  isRefreshing,
}: CalendarToolbarProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const isCurrentDayToday = isToday(anchor)
  const relativeLabel = getRelativeDayLabel(anchor)

  const goPrev = () => {
    onAnchorChange(view === 'week' ? subWeeks(anchor, 1) : subDays(anchor, 1))
  }
  const goNext = () => {
    onAnchorChange(view === 'week' ? addWeeks(anchor, 1) : addDays(anchor, 1))
  }
  const goToday = () => onAnchorChange(new Date())

  const title =
    view === 'week' ? `Week of ${format(anchor, 'MMM d, yyyy')}` : format(anchor, 'EEEE, MMM d')

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50/70 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Schedule
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {bookingCount} booking{bookingCount === 1 ? '' : 's'} in view · Focus Schedule
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200/80 bg-slate-100/80 p-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onViewChange(v.id)}
                className={cn(
                  'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  view === v.id
                    ? 'bg-slate-900 font-semibold text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {v.label}
              </button>
            ))}
          </div>

          <StaffPicker
            employees={employees}
            value={staffId}
            onChange={onStaffChange}
            allowAll={true}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className={cn(
              'flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all',
              !isCurrentDayToday
                ? 'border border-amber-600 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 hover:scale-[1.02] active:scale-[0.98]'
                : 'border border-slate-200/80 bg-slate-100 text-slate-700 hover:bg-slate-200/80',
            )}
            title={!isCurrentDayToday ? 'Return to Today' : 'Currently viewing Today'}
          >
            {!isCurrentDayToday ? (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-200 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
            <span>Today</span>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="Refresh schedule"
              aria-label="Refresh schedule"
              className="ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <RefreshCw
                className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-amber-600')}
              />
            </button>
          )}
        </div>

        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200/60 bg-slate-50/60 px-2.5 py-1.5 text-sm font-bold text-slate-900 transition-colors hover:border-amber-300 hover:bg-amber-50/30"
            >
              <CalendarIcon className="h-4 w-4 text-amber-600" />
              <span>{title}</span>
              {relativeLabel && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight',
                    isCurrentDayToday
                      ? 'border border-amber-300/80 bg-amber-100 text-amber-900'
                      : 'border border-slate-200 bg-white text-slate-600',
                  )}
                >
                  {relativeLabel}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-80 p-2">
            <Calendar
              mode="single"
              selected={anchor}
              onSelect={(d) => {
                if (d) {
                  onAnchorChange(d)
                  setPickerOpen(false)
                }
              }}
            />
          </PopoverContent>
        </Popover>

        <div className="hidden items-center gap-3 text-[11px] text-slate-500 lg:flex">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Hold
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" /> Reauth
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Captured
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> No-show
          </span>
        </div>
      </div>
    </div>
  )
}
