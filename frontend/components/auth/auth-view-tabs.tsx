'use client'

import type { AuthModalView } from '@/components/auth/auth-context'
import { cn } from '@/lib/utils'

export type AuthTabOption = {
  label: string
  value: AuthModalView
  accent?: boolean
}

interface AuthViewTabsProps {
  options: AuthTabOption[]
  value: AuthModalView
  onChange: (view: AuthModalView) => void
}

export function AuthViewTabs({ options, value, onChange }: AuthViewTabsProps) {
  return (
    <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 rounded-lg py-1.5 transition-all',
              active && option.accent
                ? 'bg-amber-500 text-white shadow-xs'
                : active
                  ? 'bg-white text-slate-900 shadow-xs'
                  : option.accent
                    ? 'text-amber-700 hover:text-amber-900'
                    : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
