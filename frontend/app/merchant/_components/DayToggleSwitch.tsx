'use client'

import { cn } from '@/lib/utils'

export interface DayToggleSwitchProps {
  checked: boolean
  disabled?: boolean
  onChange: () => void
  ariaLabel: string
}

export function DayToggleSwitch({ checked, disabled, onChange, ariaLabel }: DayToggleSwitchProps) {
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
