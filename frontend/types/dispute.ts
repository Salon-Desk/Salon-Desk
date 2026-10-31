export type DisputeCaseStatus =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'EVIDENCE_READY'
  | 'WAITING_FOR_SELLER_RESPONSE'
  | 'EVIDENCE_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'OFFER_MADE'
  | 'RESOLVED_SELLER_FAVOR'
  | 'RESOLVED_BUYER_FAVOR'

export type DisputeRecommendation = 'FILE_EVIDENCE' | 'MAKE_OFFER'

export type WaitlistStatus = 'WAITING' | 'OFFERED' | 'RESCUED_FILLED' | 'EXPIRED'

export interface DisputeTranscriptExcerpt {
  role: string
  amharic?: string
  english?: string
  message?: string
}

export interface DisputeInvestigatorReport {
  booking_id: string
  booking_status: string
  created_at_utc?: string | null
  starts_at_utc?: string | null
  free_cancel_deadline_at_utc?: string | null
  agreed_no_show_fee: string
  captured_amount: string
  capture_id?: string | null
  paypal_capture_id?: string | null
  ed25519_consent_verified: boolean
  terms_text_hash: string
  signature_prefix: string
  ledger_chain_verified: boolean
  ledger_entries_checked: number
  ledger_error?: string | null
  terminal_ledger_hash: string
  transcript_excerpt?: DisputeTranscriptExcerpt[]
}

export interface DisputeCase {
  id: string
  booking_id: string
  org_id: string
  capture_id?: string | null
  paypal_dispute_id: string
  paypal_transaction_id?: string | null
  reason: string
  dispute_amount: string | number
  status: DisputeCaseStatus
  consent_verified: boolean
  ledger_chain_verified: boolean
  ledger_entries_checked: number
  transcript_excerpt_json?: DisputeTranscriptExcerpt[] | null
  investigator_report_json?: DisputeInvestigatorReport | null
  advocate_rebuttal_text?: string | null
  skeptic_win_probability?: number | null
  skeptic_critique?: string | null
  recommended_action?: DisputeRecommendation | null
  recommended_offer_amount?: string | number | null
  paypal_debug_id?: string | null
  adjudication_outcome?: string | null
  resolved_at?: string | null
  created_at: string
  updated_at: string
}

export interface DisputeKPIs {
  total_disputes: number
  disputed_volume_usd: string | number
  evidence_ready_count: number
  resolved_seller_favor_count: number
  average_win_probability: number
}

export interface DisputeListResponse {
  items: DisputeCase[]
  kpis: DisputeKPIs
}

export interface WaitlistEntry {
  id: string
  org_id: string
  service_id: string
  client_id?: string | null
  client_name: string
  client_email: string
  preferred_starts_at: string
  status: WaitlistStatus
  rescued_booking_id?: string | null
  created_at: string
}

export interface SlotRescueNegotiationRound {
  round: number
  role: string
  amharic?: string
  english: string
  verdict?: string
}

export interface SlotRescueResponse {
  status: string
  action: string
  waived_amount: string | number
  refund_amount: string | number
  original_booking_id: string
  replacement_booking_id: string
  waitlist_entry_id: string
  replacement_client_name: string
  paypal_result: Record<string, unknown>
  negotiation_rounds: SlotRescueNegotiationRound[]
}
