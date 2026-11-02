/** Lifecycle of a PayPal authorization hold, from reservation through settlement. */
export type HoldState =
  | 'HELD'
  | 'CAPTURED'
  | 'VOIDED'
  | 'NO_SHOW_CAPTURED'
  | 'REAUTHORIZED'
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'REFUNDED'

export interface Booking {
  id: string
  clientName: string
  clientEmail: string
  clientPhone: string
  salonId: string
  salonName: string
  serviceId: string
  serviceName: string
  stylistId: string
  stylistName: string
  stylistPicture?: string | null
  appointmentTime: string
  startsAt?: string
  endsAt?: string
  customerNotes?: string | null
  durationMin: number
  servicePrice: number
  /** Locked authorization ceiling from booking.agreed_hold_amount */
  holdAmount: number
  /** Locked no-show fee from booking.agreed_no_show_fee */
  noShowFee: number
  /** Locked late-cancellation fee from booking.agreed_late_cancel_fee */
  lateCancelFee: number
  freeCancelDeadlineAt?: string | null
  cancellationFeeCharged?: number | null
  cancellationFeeReason?: string | null
  status: HoldState
  paypalAuthId: string
  paypalOrderId?: string | null
  holdStatus?: string | null
  capturedAmount?: number | null
  /** @deprecated Prefer freeCancelDeadlineLabel / honorExpiresLabel */
  authExpiresAt: string
  /** Human-readable free-cancel deadline (from free_cancel_deadline_at) */
  freeCancelDeadlineLabel: string
  /** Human-readable PayPal honor window end (from hold.honor_expires_at when known) */
  honorExpiresLabel?: string
  policySnapshot?: Record<string, unknown>
  commissionSnapshot?: Record<string, unknown>
  idempotencyKey: string
  consentHash: string
  consentTermsVersion?: string | null
  consentSignedAt?: string | null
  createdAt: string
  settledAt?: string
  settlementNote?: string
  honorPeriodEndsInHours?: number
  reauthorizationCount?: number
  reauthorizedAt?: string
  refundId?: string | null
  refundAmount?: number | null
  refundStatus?: string | null
  /** Organization timezone (e.g., 'America/New_York') */
  organizationTimezone?: string | null
  paymentHold?: {
    authorizedAt?: string | null
    createdAt?: string | null
    [key: string]: unknown
  } | null
  authorizedAt?: string | null
}

export type LedgerAction =
  | 'AUTHORIZATION_CREATED'
  | 'FULL_PAYMENT_CAPTURED'
  | 'NO_SHOW_FEE_CAPTURED'
  | 'AUTHORIZATION_VOIDED'
  | 'GOODWILL_PARTIAL_REFUND'
  | 'HONOR_PERIOD_REAUTHORIZED'

export interface AuditLedgerEntry {
  id: string
  bookingId: string
  clientName: string
  serviceName: string
  action: LedgerAction
  amount: number
  currency: string
  paypalDebugId: string
  webhookVerified: boolean
  timestamp: string
  details: string
}
