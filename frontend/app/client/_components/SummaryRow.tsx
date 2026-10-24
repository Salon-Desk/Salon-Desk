import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface SummaryRowProps {
  icon: ReactNode
  label: string
  children: ReactNode
  muted?: boolean
}

export function SummaryRow({ icon, label, children, muted }: SummaryRowProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</p>
        <div className={cn('text-sm', muted ? 'text-stone-400' : 'font-medium text-stone-900')}>
          {children}
        </div>
      </div>
    </div>
  )
}
