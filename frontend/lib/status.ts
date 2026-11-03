import type { ChangeRequestStatus, HoldState, LedgerAction, OrganizationStatus } from '@/types'

/**
 * Single colour vocabulary shared by every status surface (badges, timeline
 * cards, banners). Mapping a domain status to a `Tone` here means a colour
 * change lands everywhere at once.
 */
export type Tone = 'amber' | 'emerald' | 'sky' | 'rose' | 'slate' | 'purple' | 'blue'

export const HOLD_STATE_TONE: Record<HoldState, Tone> = {
  HELD: 'amber',
  REAUTHORIZED: 'sky',
  CAPTURED: 'emerald',
  NO_SHOW_CAPTURED: 'rose',
  VOIDED: 'slate',
  PENDING: 'amber',
  PENDING_PAYMENT: 'amber',
  REFUNDED: 'purple',
}

export const HOLD_STATE_LABEL: Record<HoldState, string> = {
  HELD: 'Held',
  REAUTHORIZED: 'Reauthorized',
  CAPTURED: 'Captured',
  NO_SHOW_CAPTURED: 'No-show fee',
  VOIDED: 'Voided',
  PENDING: 'Payment Pending',
  PENDING_PAYMENT: 'Payment Pending',
  REFUNDED: 'Refunded',
}

/** Compact labels for the appointment filter pills. */
export const HOLD_STATE_FILTER_LABEL: Record<HoldState, string> = {
  HELD: 'Held',
  REAUTHORIZED: 'Reauth',
  CAPTURED: 'Captured',
  NO_SHOW_CAPTURED: 'No-Show',
  VOIDED: 'Voided',
  PENDING: 'Pending',
  PENDING_PAYMENT: 'Pending',
  REFUNDED: 'Refunded',
}

export const HOLD_STATES = Object.keys(HOLD_STATE_TONE) as HoldState[]

export const LEDGER_ACTION_TONE: Record<LedgerAction, Tone> = {
  AUTHORIZATION_CREATED: 'amber',
  FULL_PAYMENT_CAPTURED: 'emerald',
  NO_SHOW_FEE_CAPTURED: 'rose',
  AUTHORIZATION_VOIDED: 'slate',
  HONOR_PERIOD_REAUTHORIZED: 'sky',
}

export const ORGANIZATION_STATUS_TONE: Record<OrganizationStatus, Tone> = {
  APPROVED: 'emerald',
  PENDING_REVIEW: 'amber',
  SUSPENDED: 'rose',
}

export const CHANGE_REQUEST_STATUS_TONE: Record<ChangeRequestStatus, Tone> = {
  PENDING_REVIEW: 'amber',
  APPROVED: 'emerald',
  REJECTED: 'rose',
}
