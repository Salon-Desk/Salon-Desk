import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { type Tone, TONE_TEXT } from './tone'

export interface DetailRowProps {
  label: ReactNode
  value: ReactNode
  /** Tints the value — use for amounts that need to read as held/captured/void. */
  tone?: Tone
  emphasis?: 'normal' | 'bold'
  /** Adds a hairline above the row to separate a total from its breakdown. */
  divider?: boolean
  className?: string
}

/** `Label ………… Value` row, the backbone of every financial breakdown panel. */
export function DetailRow({
  label,
  value,
  tone,
  emphasis = 'normal',
  divider = false,
  className,
}: DetailRowProps) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-3 text-xs',
        divider && 'mt-1 border-slate-200 border-t pt-1.5',
        className,
      )}
    >
      <span className="text-slate-500">{label}</span>
      <span
        className={cn(
          'text-right',
          emphasis === 'bold' ? 'font-bold' : 'font-medium',
          tone ? TONE_TEXT[tone] : 'text-slate-900',
        )}
      >
        {value}
      </span>
    </div>
  )
}

/** Uppercase mono caption introducing a group of detail rows. */
export function DetailGroupLabel({ children }: { children: ReactNode }) {
  return <span className="block font-mono text-[10px] text-slate-500 uppercase">{children}</span>
}
