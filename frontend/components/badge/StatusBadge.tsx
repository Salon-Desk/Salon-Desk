'use client'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import {
  CHANGE_REQUEST_STATUS_TONE,
  HOLD_STATE_TONE,
  LEDGER_ACTION_TONE,
  ORGANIZATION_STATUS_TONE,
} from '@/lib/status'
import { getAgentStatusBadgeStyle } from '@/lib/util/status-badge'
import { cn } from '@/lib/utils'
import type { ChangeRequestStatus, HoldState, LedgerAction, OrganizationStatus } from '@/types'

export type StatusBadgeProps = {
  status?: string
  children?: React.ReactNode
  tone?: BadgeProps['tone']
  size?: BadgeProps['size']
  dot?: boolean
  pulsing?: boolean
  className?: string
}

export function StatusBadge({
  status,
  children,
  tone,
  size,
  dot,
  pulsing,
  className,
}: StatusBadgeProps) {
  if (tone || children) {
    return (
      <Badge tone={tone} size={size} dot={dot} pulsing={pulsing} className={className}>
        {children ?? status}
      </Badge>
    )
  }

  const { className: toneClassName } = getAgentStatusBadgeStyle(status || '')

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

export type BaseStatusBadgeProps = Omit<BadgeProps, 'children' | 'tone'>

/** Renders a hold state with its canonical colour and micro-dot kinetic pulse. */
export function HoldStateBadge({ status, ...props }: BaseStatusBadgeProps & { status: HoldState }) {
  const isLive = status === 'HELD' || status === 'REAUTHORIZED'
  const isCaptured = status === 'CAPTURED'

  return (
    <Badge tone={HOLD_STATE_TONE[status]} dot={isLive || isCaptured} pulsing={isLive} {...props}>
      {status}
    </Badge>
  )
}

export function OrganizationStatusBadge({
  status,
  ...props
}: BaseStatusBadgeProps & { status: OrganizationStatus }) {
  const isApproved = status === 'APPROVED'
  const isPending = status === 'PENDING_REVIEW'

  return (
    <Badge
      tone={ORGANIZATION_STATUS_TONE[status]}
      dot={isApproved || isPending}
      pulsing={isPending}
      {...props}
    >
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

export function ChangeRequestStatusBadge({
  status,
  ...props
}: BaseStatusBadgeProps & { status: ChangeRequestStatus }) {
  const isPending = status === 'PENDING_REVIEW'

  return (
    <Badge tone={CHANGE_REQUEST_STATUS_TONE[status]} dot={isPending} pulsing={isPending} {...props}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

export function LedgerActionBadge({
  action,
  ...props
}: BaseStatusBadgeProps & { action: LedgerAction }) {
  return (
    <Badge tone={LEDGER_ACTION_TONE[action]} uppercase={false} {...props}>
      {action}
    </Badge>
  )
}

export default StatusBadge
