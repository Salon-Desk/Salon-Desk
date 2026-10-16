import {
  CHANGE_REQUEST_STATUS_TONE,
  HOLD_STATE_TONE,
  LEDGER_ACTION_TONE,
  ORGANIZATION_STATUS_TONE,
} from '@/lib/status'
import type { ChangeRequestStatus, HoldState, LedgerAction, OrganizationStatus } from '@/types'

import { Badge, type BadgeProps } from './badge'

type StatusBadgeProps = Omit<BadgeProps, 'children' | 'tone'>

/** Renders a hold state with its canonical colour and micro-dot kinetic pulse. */
export function HoldStateBadge({ status, ...props }: StatusBadgeProps & { status: HoldState }) {
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
}: StatusBadgeProps & { status: OrganizationStatus }) {
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
}: StatusBadgeProps & { status: ChangeRequestStatus }) {
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
}: StatusBadgeProps & { action: LedgerAction }) {
  return (
    <Badge tone={LEDGER_ACTION_TONE[action]} uppercase={false} {...props}>
      {action}
    </Badge>
  )
}
