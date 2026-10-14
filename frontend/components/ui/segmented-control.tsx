'use client'

import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
  badge?: number
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /**
   * `tabs` — white pill on a slate track (view switchers).
   * `pills` — amber pill on a white track (filters).
   */
  variant?: 'tabs' | 'pills'
  fullWidth?: boolean
  className?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = 'tabs',
  fullWidth = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-xl border p-1',
        variant === 'tabs'
          ? 'border-slate-200 bg-slate-100'
          : 'border-slate-200 bg-white shadow-xs',
        fullWidth && 'w-full',
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold text-xs whitespace-nowrap transition-all',
              fullWidth && 'flex-1',
              isActive
                ? variant === 'tabs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'border border-amber-300 bg-amber-100 text-amber-900'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 text-amber-500" />}
            <span>{option.label}</span>
            {option.badge !== undefined && option.badge > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.5 font-black text-[10px] text-slate-950">
                {option.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
