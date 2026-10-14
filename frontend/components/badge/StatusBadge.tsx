'use client'

import { getAgentStatusBadgeStyle } from '@/lib/util/status-badge'
import { cn } from '@/lib/utils'

type StatusBadgeProps = {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { className: toneClassName } = getAgentStatusBadgeStyle(status)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2.5 py-1 text-[11px] font-bold leading-[13px]',
        toneClassName,
        className,
      )}
    >
      {status}
    </span>
  )
}

export default StatusBadge
