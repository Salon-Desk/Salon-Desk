export interface ApiBookingService {
  id: string
  booking_id: string
  service_id: string
  base_price: string | number
}

export interface ApiBooking {
  id: string
  org_id: string
  client_id: string
  stylist_id?: string | null
  starts_at: string
  ends_at: string
  status: string
  cancellation_fee_json?: Record<string, unknown> | null
  cancellation_reason?: string | null
  total_price: string | number
  commission_snapshot: Record<string, unknown>
  customer_notes?: string | null
  created_at: string
  booking_services?: ApiBookingService[]
  client_name?: string | null
  client_picture?: string | null
  client_email?: string | null
  client_phone?: string | null
  stylist_name?: string | null
  stylist_picture?: string | null
  service_name?: string | null
}

export interface OrgBookingsQuery {
  starts_at?: string
  ends_at?: string
}

export interface CreateBookingRequest {
  org_id: string
  starts_at: string
  service_ids: string[]
  stylist_id?: string | null
  customer_notes?: string | null
}

export interface CancelBookingRequest {
  reason?: string | null
}

export interface ConsentRequest {
  terms_version: string
  terms_text: string
  signed_payload: string
}

export interface ApiConsent {
  id: string
  booking_id: string
  client_id: string
  terms_version: string
  terms_text_hash: string
  created_at: string
}

export interface TimeSlot {
  starts_at: string
  ends_at: string
  available: boolean
}

export interface CreateHoldRequest {
  booking_id: string
  idempotency_key: string
  currency?: string
}

export interface PaymentHold {
  id: string
  booking_id: string
  org_id: string
  paypal_order_id?: string | null
  paypal_authorization_id?: string | null
  amount: string | number
  currency: string
  status: string
  honor_expires_at?: string | null
  idempotency_key: string
  created_at: string
}

export interface PaymentCapture {
  id: string
  hold_id: string
  booking_id: string
  paypal_capture_id?: string | null
  amount: string | number
  currency: string
  capture_type: string
  status: string
  paypal_debug_id?: string | null
  created_at: string
}
