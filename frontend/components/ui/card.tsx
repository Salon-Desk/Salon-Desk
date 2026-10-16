import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { type Tone, TONE_HOVER_BORDER, TONE_ICON_CHIP } from './tone'

export interface CardProps {
  children: ReactNode
  /** Adds a hover border in the given tone — omit for static panels. */
  hoverTone?: Tone
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

export function Card({ children, hoverTone, padding = 'md', className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]',
        padding === 'sm' && 'p-3.5',
        padding === 'md' && 'p-4 sm:p-5',
        padding === 'lg' && 'p-5 sm:p-6',
        hoverTone &&
          `transition-all hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${TONE_HOVER_BORDER[hoverTone]}`,
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Rounded square that frames a lucide icon in a tone-matched chip. */
export function IconChip({
  children,
  tone = 'amber',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border p-2', TONE_ICON_CHIP[tone], className)}>{children}</div>
  )
}

/** Inset slate panel used for read-only detail groups. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5', className)}
    >
      {children}
    </div>
  )
}
