/** Lifecycle of a PayPal authorization hold, from reservation through settlement. */
export type HoldState =
  | "HELD"
  | "CAPTURED"
  | "VOIDED"
  | "NO_SHOW_CAPTURED"
  | "REAUTHORIZED";

export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  salonId: string;
  salonName: string;
  serviceId: string;
  serviceName: string;
  stylistId: string;
  stylistName: string;
  appointmentTime: string;
  durationMin: number;
  servicePrice: number;
  holdAmount: number;
  noShowFee: number;
  status: HoldState;
  paypalAuthId: string;
  authExpiresAt: string;
  idempotencyKey: string;
  consentHash: string;
  createdAt: string;
  settledAt?: string;
  settlementNote?: string;
  honorPeriodEndsInHours?: number;
  reauthorizedAt?: string;
}

export type LedgerAction =
  | "AUTHORIZATION_CREATED"
  | "FULL_PAYMENT_CAPTURED"
  | "NO_SHOW_FEE_CAPTURED"
  | "AUTHORIZATION_VOIDED"
  | "GOODWILL_PARTIAL_REFUND"
  | "HONOR_PERIOD_REAUTHORIZED";

export interface AuditLedgerEntry {
  id: string;
  bookingId: string;
  clientName: string;
  serviceName: string;
  action: LedgerAction;
  amount: number;
  currency: string;
  paypalDebugId: string;
  webhookVerified: boolean;
  timestamp: string;
  details: string;
}
