export interface CatalogStaffMember {
  id: string
  org_id: string
  role: string
  display_name: string
  picture?: string | null
  rating_avg: number
  review_count: number
  specialties: string[]
}

export interface ClientFeedbackItem {
  id: string
  booking_id: string
  org_id: string
  organization_name?: string | null
  stylist_id?: string | null
  rating: number
  comment?: string | null
  status?: string
  created_at: string
  client_name?: string | null
  stylist_name?: string | null
  service_name?: string | null
  moderation_notes?: string | null
  moderated_at?: string | null
}

export interface CreateClientFeedbackBody {
  booking_id: string
  rating: number
  comment?: string | null
  stylist_id?: string | null
}
