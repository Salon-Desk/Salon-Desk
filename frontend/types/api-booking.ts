export interface ApiBookingService {
  id: string
  booking_id: string
  service_id: string
  base_price: string | number
  service_policy_snapshot_json?: Record<string, unknown>
  commission_rule_snapshot_json?: Record<string, unknown>
}

export interface ApiBooking {
  id: string
  org_id: string
  client_id: string
  stylist_id?: string | null
  starts_at: string
  ends_at: string
  status: string
  total_price: string | number
  agreed_hold_amount: string | number
  agreed_no_show_fee: string | number
  agreed_late_cancel_fee?: string | number
  free_cancel_deadline_at: string
  policy_snapshot_json: Record<string, unknown>
  commission_snapshot: Record<string, unknown>
  cancellation_fee_json?: Record<string, unknown> | null
  cancellation_reason?: string | null
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
  organization_name?: string | null
  organization_timezone?: string | null
  paypal_auth_id?: string | null
  paypal_order_id?: string | null
  hold_status?: string | null
  hold_amount?: string | number | null
  captured_amount?: string | number | null
  honor_expires_at?: string | null
  reauthorization_count?: number | null
  idempotency_key?: string | null
  consent_hash?: string | null
  consent_terms_version?: string | null
  consent_signed_at?: string | null
}

export interface OrgBookingsQuery {
  starts_at?: string
  ends_at?: string
}

export interface ServiceStylistSelection {
  service_id: string
  stylist_id?: string | null
}

export interface CreateBookingRequest {
  org_id: string
  starts_at: string
  service_ids: string[]
  stylist_id?: string | null
  service_stylists?: ServiceStylistSelection[]
  party_size?: number
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

export interface AvailabilityResponse {
  timezone: string
  day: string
  open_windows: [string, string][] | string[][]
  slots: TimeSlot[]
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
  parent_authorization_id?: string | null
  latest_authorization_id?: string | null
  amount: string | number
  captured_amount: string | number
  currency: string
  status: string
  honor_expires_at?: string | null
  reauthorization_count: number
  idempotency_key: string
  created_at: string
  /** When status is PENDING — open this link to approve the AUTHORIZE hold. */
  approval_url?: string | null
}

export interface CompleteHoldRequest {
  paypal_order_token?: string | null
}

export interface PaymentCapture {
  id: string
  hold_id: string
  booking_id: string
  paypal_capture_id?: string | null
  amount: string | number
  currency: string
  capture_type: string
  final_capture: boolean
  status: string
  paypal_debug_id?: string | null
  created_at: string
}

/* ── Chat / LiveKit shapes ── */

export interface ClientChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type AssistantPortal = 'client' | 'merchant' | 'admin'

export interface ClientChatRequest {
  message: string
  language?: string
  org_id?: string
  history?: ClientChatMessage[]
  user_lat?: number | null
  user_lng?: number | null
  /** client = booking concierge; merchant/admin = system help */
  portal?: AssistantPortal
}

export interface ClientChatResponse {
  reply: string
  provider?: string
  model?: string
  detected_language?: string
  intent?: string
  auth_token?: string | null
  user?: import('./user').User | null
  recommendations?: Array<{
    service_id: string
    organization_id: string
    name: string
    organization_name: string
    organization_picture?: string | null
    image_url?: string | null
    base_price: string | number
    duration_minutes: number
    category_name?: string | null
    description?: string | null
    physical_address?: string | null
    distance_km?: number | null
  }>
  organizations?: Array<{
    id: string
    name: string
    description?: string | null
    picture?: string | null
    physical_address?: string | null
    rating?: number
    service_count?: number
    distance_km?: number | null
  }>
  stylists?: Array<{
    id: string
    name: string
    organization_id?: string | null
    organization_name?: string | null
    role?: string | null
    picture?: string | null
    bio?: string | null
    rating?: number | null
    is_any?: boolean
  }>
  confirmed_booking?: {
    id: string
    service_name: string
    organization_name?: string | null
    starts_at: string
    formatted_time?: string | null
    total_price: string | number
    status: string
  } | null
  navigation?: {
    target: string
    tab?: string | null
    label: string
    reason?: string | null
  } | null
  ui_action?: {
    action: string
    target?: string | null
    label?: string | null
    details?: string | null
    selector?: string | null
  } | null
  payment_link?: string | null
}

export interface LiveKitTokenRequest {
  language?: string
  participant_name?: string
  metadata?: string
  portal?: AssistantPortal
}

export interface LiveKitTokenResponse {
  token: string
  server_url: string
  room_name: string
}
