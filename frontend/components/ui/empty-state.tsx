import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { type Tone, TONE_ICON_CHIP } from './tone'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  tone?: Tone
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'amber',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'mx-auto max-w-md rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border',
          TONE_ICON_CHIP[tone],
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="mb-1 font-bold text-slate-900 text-sm">{title}</h4>
      {description && <p className="mb-4 text-slate-500 text-xs leading-relaxed">{description}</p>}
      {action}
    </div>
  )
}
