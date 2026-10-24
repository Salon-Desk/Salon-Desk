'use client'

import { addDays, addWeeks, format, subDays, subWeeks } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { CalendarViewMode } from '@/lib/util/calendar'
import { cn } from '@/lib/utils'
import type { User } from '@/types/user'

import { ALL_STAFF_VALUE, StaffPicker } from './StaffPicker'

const VIEWS: { id: CalendarViewMode; label: string }[] = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
]

interface CalendarToolbarProps {
  view: CalendarViewMode
  onViewChange: (view: CalendarViewMode) => void
  anchor: Date
  onAnchorChange: (date: Date) => void
  employees: User[]
  staffId: string
  onStaffChange: (id: string) => void
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
                onClick={() => {
                  onViewChange(v.id)
                  if (v.id !== 'agenda' && staffId === ALL_STAFF_VALUE && employees[0]) {
                    onStaffChange(employees[0].id)
                  }
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                  view === v.id
                    ? 'bg-slate-900 font-semibold text-white'
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
            allowAll={view === 'agenda'}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="h-9 rounded-lg px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
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
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-amber-600" />
              {title}
            </button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-auto p-2">
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
