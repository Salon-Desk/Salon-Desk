'use client'

import { Check } from 'lucide-react'
import React from 'react'

import { cn } from '@/lib/utils'

export type CheckoutWizardStep = 1 | 2 | 3

export const WIZARD_STEPS = [
  { id: 1 as const, label: 'Stylist' },
  { id: 2 as const, label: 'Date & time' },
  { id: 3 as const, label: 'Review & agree' },
]

export function BookingStepper({
  current,
  subtitles,
  onStepClick,
}: {
  current: CheckoutWizardStep
  subtitles: Record<CheckoutWizardStep, string | null>
  onStepClick: (step: CheckoutWizardStep) => void
}) {
  return (
    <ol className="flex items-start">
      {WIZARD_STEPS.map((s, index) => {
        const done = current > s.id
        const active = current === s.id
        const last = index === WIZARD_STEPS.length - 1
        return (
          <li key={s.id} className={cn('flex items-start', !last && 'flex-1')}>
            <button
              type="button"
              disabled={!done}
              onClick={() => onStepClick(s.id)}
              className={cn(
                'flex min-w-0 items-center gap-2.5 text-left transition-opacity',
                done ? 'cursor-pointer hover:opacity-80' : 'cursor-default disabled:opacity-100',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all',
                  done && 'bg-emerald-600 text-white',
                  active && 'bg-stone-950 text-white ring-4 ring-amber-200/70',
                  !done && !active && 'border border-stone-200 bg-white text-stone-400',
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : s.id}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span
                  className={cn(
                    'block text-xs font-semibold',
                    active || done ? 'text-stone-900' : 'text-stone-400',
                  )}
                >
                  {s.label}
                </span>
                <span className="block max-w-[11rem] truncate text-[11px] text-stone-500">
                  {subtitles[s.id] ?? (active ? 'In progress' : '—')}
                </span>
              </span>
            </button>
            {!last ? (
              <span
                className={cn(
                  'mx-2 mt-[18px] h-0.5 flex-1 rounded-full sm:mx-4',
                  done ? 'bg-emerald-500' : 'bg-stone-200',
                )}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
