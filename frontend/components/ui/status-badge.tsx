import {
  CHANGE_REQUEST_STATUS_TONE,
  HOLD_STATE_TONE,
  LEDGER_ACTION_TONE,
  ORGANIZATION_STATUS_TONE,
} from '@/lib/status'
import type { ChangeRequestStatus, HoldState, LedgerAction, OrganizationStatus } from '@/types'

import { Badge, type BadgeProps } from './badge'

type StatusBadgeProps = Omit<BadgeProps, 'children' | 'tone'>

/** Renders a hold state with its canonical colour. */
export function HoldStateBadge({ status, ...props }: StatusBadgeProps & { status: HoldState }) {
  return (
    <Badge tone={HOLD_STATE_TONE[status]} {...props}>
      {status}
    </Badge>
  )
}

export function OrganizationStatusBadge({
  status,
  ...props
}: StatusBadgeProps & { status: OrganizationStatus }) {
  return (
    <Badge tone={ORGANIZATION_STATUS_TONE[status]} {...props}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

export function ChangeRequestStatusBadge({
  status,
  ...props
}: StatusBadgeProps & { status: ChangeRequestStatus }) {
  return (
    <Badge tone={CHANGE_REQUEST_STATUS_TONE[status]} {...props}>
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
