import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface SectionHeadingProps {
  title: ReactNode
  description?: ReactNode
  /** Right-aligned controls: buttons, filters, search. */
  action?: ReactNode
  size?: 'sm' | 'md'
  className?: string
}

/** Title + supporting copy + trailing actions, repeated atop every tab panel. */
export function SectionHeading({
  title,
  description,
  action,
  size = 'md',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn('flex flex-col justify-between gap-4 md:flex-row md:items-center', className)}
    >
      <div>
        {size === 'md' ? (
          <h2 className="font-bold text-slate-900 text-xl">{title}</h2>
        ) : (
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">{title}</h3>
        )}
        {description && <p className="text-slate-600 text-xs leading-relaxed">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2.5">{action}</div>}
    </div>
  )
}
