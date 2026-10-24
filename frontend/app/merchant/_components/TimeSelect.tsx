'use client'

import { ChevronDown } from 'lucide-react'

import { TIME_OPTIONS } from '@/constant/working-hours'
import { formatTime12 } from '@/lib/util/working-hours'

export interface TimeSelectProps {
  value: string
  disabled?: boolean
  onChange: (val: string) => void
  label: string
}

export function TimeSelect({ value, disabled, onChange, label }: TimeSelectProps) {
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
