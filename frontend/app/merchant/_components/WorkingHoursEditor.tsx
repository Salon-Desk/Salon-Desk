'use client'

import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Clock,
  Copy,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { toastColor } from '@/constant/toast-color'
import { DAYS, DEFAULT_WORKING_HOURS, TIME_OPTIONS } from '@/constant/working-hours'
import {
  calculateWeeklyStats,
  formatIntervalDuration,
  formatTime12,
} from '@/lib/util/working-hours'
import { cn } from '@/lib/utils'
import type { DayKey, TimeInterval, WorkingHoursMap } from '@/types/api-org'

interface WorkingHoursEditorProps {
  value?: WorkingHoursMap | Record<string, unknown> | null
  onChange: (hours: WorkingHoursMap) => void
  disabled?: boolean
}

interface TimeSelectProps {
  value: string
  disabled?: boolean
  onChange: (val: string) => void
  label: string
}

function TimeSelect({ value, disabled, onChange, label }: TimeSelectProps) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-lg border border-slate-200/90 bg-white pl-3 pr-7 text-xs font-semibold text-slate-800 shadow-2xs transition-colors hover:border-slate-300 focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {TIME_OPTIONS.map((time) => (
          <option key={time} value={time}>
            {formatTime12(time)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400" />
    </div>
  )
}

function DayToggleSwitch({
  checked,
  disabled,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  disabled?: boolean
  onChange: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-amber-600' : 'bg-slate-200',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  )
}

export function WorkingHoursEditor({ value, onChange, disabled = false }: WorkingHoursEditorProps) {
  // Normalize value to canonical WorkingHoursMap
  const schedule: WorkingHoursMap = useMemo(() => {
    if (!value || typeof value !== 'object') return DEFAULT_WORKING_HOURS
    const normalized: Partial<WorkingHoursMap> = {}
    for (const { key } of DAYS) {
      const raw = (value as Record<string, unknown>)[key]
      if (Array.isArray(raw)) {
        normalized[key] = raw
          .filter(
            (w): w is TimeInterval =>
              Array.isArray(w) &&
              w.length === 2 &&
              typeof w[0] === 'string' &&
              typeof w[1] === 'string',
          )
          .map(([start, end]) => [start, end])
      } else {
        normalized[key] = []
      }
    }
    return normalized as WorkingHoursMap
  }, [value])

  const { totalHoursFormatted, openDaysCount } = useMemo(
    () => calculateWeeklyStats(schedule),
    [schedule],
  )

  const updateDay = useCallback(
    (day: DayKey, windows: TimeInterval[]) => {
      onChange({
        ...schedule,
        [day]: windows,
      })
    },
    [schedule, onChange],
  )

  const toggleDayClosed = (day: DayKey) => {
    const current = schedule[day] || []
    if (current.length > 0) {
      updateDay(day, [])
    } else {
      updateDay(day, [['09:00', '18:00']])
    }
  }

  const handleTimeChange = (day: DayKey, index: number, field: 0 | 1, newTime: string) => {
    const current = [...(schedule[day] || [])]
    if (!current[index]) return
    const pair: TimeInterval = [...current[index]]
    pair[field] = newTime
    current[index] = pair
    updateDay(day, current)
  }

  const addInterval = (day: DayKey) => {
    const current = schedule[day] || []
    const lastWindow = current[current.length - 1]
    let start = '14:00'
    let end = '18:00'
    if (lastWindow) {
      const [, lastEnd] = lastWindow
      const [endH] = lastEnd.split(':').map(Number)
      const nextH = Math.min(22, (endH || 13) + 1)
      start = `${nextH.toString().padStart(2, '0')}:00`
      end = `${Math.min(23, nextH + 4)
        .toString()
        .padStart(2, '0')}:00`
    }
    updateDay(day, [...current, [start, end]])
  }

  const removeInterval = (day: DayKey, index: number) => {
    const current = schedule[day] || []
    updateDay(
      day,
      current.filter((_, i) => i !== index),
    )
  }

  const copyMondayToWeekdays = () => {
    const mondayWindows = schedule.mon || []
    const updated = { ...schedule }
    for (const d of ['tue', 'wed', 'thu', 'fri'] as DayKey[]) {
      updated[d] = mondayWindows.map(([s, e]) => [s, e])
    }
    onChange(updated)
    toast.success('Applied Monday schedule to Tuesday through Friday', toastColor.success)
  }

  const resetToStandard = () => {
    onChange(DEFAULT_WORKING_HOURS)
    toast.success('Reset to standard operating hours', toastColor.success)
  }

  return (
    <div className="space-y-3.5">
      {/* Quick summary & presets bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-gradient-to-r from-amber-50/50 via-white to-slate-50/80 p-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/20">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">
              Weekly Operating Schedule
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              <strong className="font-semibold text-amber-800">{totalHoursFormatted}</strong>{' '}
              scheduled ·{' '}
              <strong className="font-semibold text-slate-700">{openDaysCount} days open</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={disabled}
            onClick={copyMondayToWeekdays}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <Copy className="h-3 w-3 text-slate-500" />
            <span>Copy Mon to Weekdays</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={resetToStandard}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/60 px-2.5 py-1 text-[11px] font-semibold text-amber-800 shadow-2xs transition-colors hover:bg-amber-100/60 disabled:opacity-50"
          >
            <Sparkles className="h-3 w-3 text-amber-600" />
            <span>Reset Default</span>
          </button>
        </div>
      </div>

      {/* 7-day schedule list */}
      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
        {DAYS.map(({ key, label, short }) => {
          const windows = schedule[key] || []
          const isOpen = windows.length > 0

          return (
            <div
              key={key}
              className={cn(
                'flex flex-col gap-3 p-3 transition-colors sm:flex-row sm:items-center sm:justify-between',
                !isOpen && 'bg-slate-50/40',
              )}
            >
              {/* Day title, indicator & switch */}
              <div className="flex items-center justify-between gap-3 sm:w-44 sm:shrink-0">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'flex h-7 w-9 items-center justify-center rounded-md text-[11px] font-bold uppercase transition-colors',
                      isOpen
                        ? 'bg-amber-50 text-amber-900 border border-amber-200/70'
                        : 'bg-slate-100 text-slate-400 border border-slate-200/60',
                    )}
                  >
                    {short}
                  </div>
                  <div>
                    <span
                      className={cn(
                        'text-xs font-bold block leading-tight',
                        isOpen ? 'text-slate-900' : 'text-slate-400',
                      )}
                    >
                      {label}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-semibold',
                        isOpen ? 'text-emerald-700' : 'text-slate-400',
                      )}
                    >
                      {isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>

                <DayToggleSwitch
                  checked={isOpen}
                  disabled={disabled}
                  onChange={() => toggleDayClosed(key)}
                  ariaLabel={`Toggle ${label} status`}
                />
              </div>

              {/* Time selection controls */}
              <div className="flex-1">
                {isOpen ? (
                  <div className="space-y-2">
                    {windows.map(([start, end], idx) => {
                      const isInvalid = start >= end
                      const duration = formatIntervalDuration(start, end)

                      return (
                        <div
                          key={`${key}-${idx}`}
                          className={cn(
                            'flex flex-wrap items-center gap-2 rounded-lg border p-1.5 transition-colors',
                            isInvalid
                              ? 'border-rose-200 bg-rose-50/40'
                              : 'border-slate-200/70 bg-slate-50/30 hover:border-slate-300',
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1">
                              From
                            </span>
                            <TimeSelect
                              value={start}
                              disabled={disabled}
                              onChange={(val) => handleTimeChange(key, idx, 0, val)}
                              label={`${label} opening time`}
                            />
                          </div>

                          <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              To
                            </span>
                            <TimeSelect
                              value={end}
                              disabled={disabled}
                              onChange={(val) => handleTimeChange(key, idx, 1, val)}
                              label={`${label} closing time`}
                            />
                          </div>

                          {!isInvalid && duration && (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200/60 shadow-2xs">
                              {duration}
                            </span>
                          )}

                          {windows.length > 1 && (
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => removeInterval(key, idx)}
                              className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Remove shift interval"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {isInvalid && (
                            <div className="w-full flex items-center gap-1 text-[11px] font-medium text-rose-600 px-1 pt-0.5">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span>Closing time must be after opening time</span>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {windows.length < 3 && (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => addInterval(key)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-amber-300/80 bg-amber-50/40 px-2.5 py-1 text-[11px] font-semibold text-amber-800 transition-colors hover:bg-amber-100/50 hover:border-amber-400 disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add split shift / break</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-400">
                    <span>Closed all day</span>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleDayClosed(key)}
                      className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 transition-colors"
                    >
                      + Open hours
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
