import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { type Tone, TONE_DOT, TONE_SOFT, TONE_SOLID } from './tone'

export interface BadgeProps {
  children: ReactNode
  tone?: Tone
  variant?: 'soft' | 'solid'
  size?: 'sm' | 'md'
  uppercase?: boolean
  mono?: boolean
  dot?: boolean
  pulsing?: boolean
  className?: string
}

export function Badge({
  children,
  tone = 'amber',
  variant = 'soft',
  size = 'sm',
  uppercase = true,
  mono = false,
  dot = false,
  pulsing = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-md border font-bold whitespace-nowrap shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
        uppercase && 'tracking-wider uppercase',
        mono && 'font-mono',
        variant === 'solid' ? TONE_SOLID[tone] : TONE_SOFT[tone],
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulsing && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                TONE_DOT[tone],
              )}
            />
          )}
          <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', TONE_DOT[tone])} />
        </span>
      )}
      <span>{children}</span>
    </span>
  )
}
