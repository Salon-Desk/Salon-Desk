import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { type Tone, TONE_SOFT, TONE_SOLID } from './tone'

export interface BadgeProps {
  children: ReactNode
  tone?: Tone
  variant?: 'soft' | 'solid'
  size?: 'sm' | 'md'
  uppercase?: boolean
  mono?: boolean
  className?: string
}

export function Badge({
  children,
  tone = 'amber',
  variant = 'soft',
  size = 'sm',
  uppercase = true,
  mono = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-md border font-bold whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
        uppercase && 'tracking-wider uppercase',
        mono && 'font-mono',
        variant === 'solid' ? TONE_SOLID[tone] : TONE_SOFT[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
