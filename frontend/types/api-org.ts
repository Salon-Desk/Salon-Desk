/** Backend FastAPI shapes for org / catalog / admin RTK slices. */

export type ApiOrgStatus = 'pending' | 'approved' | 'suspended' | string
export type ApiChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | string

export interface ApiOrganization {
  id: string
  owner_id: string
  name: string
  status: ApiOrgStatus
  description?: string | null
  picture?: string | null
  created_at: string
}

export interface ApiOrgSettings {
  id: string
  org_id: string
  timezone: string
  physical_address: string
  lat?: string | number | null
  lng?: string | number | null
  working_hours: Record<string, unknown>
}

export interface ApiOrgService {
  id: string
  service_category_id: string
  organization_id: string
  name: string
  description?: string | null
  images: Record<string, unknown>
  base_price: string | number
  duration_minutes: number
  status: string
  cancellation_policy_id?: string | null
  simultaneous_capacity: number
  created_at: string
}

export interface CreateOrgServiceRequest {
  service_category_id: string
  name: string
  base_price: number
  duration_minutes: number
  description?: string | null
  images?: Record<string, unknown>
  simultaneous_capacity?: number
  cancellation_policy_id?: string | null
}

export interface UpdateOrgServiceRequest {
  service_category_id?: string
  name?: string
  description?: string | null
  images?: Record<string, unknown>
  base_price?: number
  duration_minutes?: number
  simultaneous_capacity?: number
  cancellation_policy_id?: string | null
  status?: string
}

export interface ApiChangeRequest {
  id: string
  org_id: string
  request_type: string
  payload_json: Record<string, unknown>
  current_snapshot_json: Record<string, unknown>
  status: ApiChangeRequestStatus
  submitted_by: string
  reviewed_by?: string | null
  review_notes?: string | null
  created_at: string
  reviewed_at?: string | null
}

export interface CreateChangeRequestBody {
  request_type: string
  payload_json: Record<string, unknown>
  current_snapshot_json: Record<string, unknown>
}

export interface CatalogOrganization {
  id: string
  name: string
  description?: string | null
  picture?: string | null
  physical_address?: string | null
  lat?: string | number | null
  lng?: string | number | null
  timezone?: string | null
}

export interface CatalogService {
  id: string
  organization_id: string
  service_category_id: string
  name: string
  description?: string | null
  images: Record<string, unknown>
  base_price: string | number
  duration_minutes: number
  simultaneous_capacity: number
  organization_name?: string | null
  category_name?: string | null
}

export interface ApiServiceCategory {
  id: string
  name: string
  description?: string | null
  created_at: string
}

export interface CreateServiceCategoryRequest {
  name: string
  description?: string | null
}

export interface UpdateServiceCategoryRequest {
  name?: string
  description?: string | null
}

export interface PlatformCommission {
  id: string
  service_category_id: string
  name: string
  type: string
  percentage?: string | number | null
  flat?: string | number | null
  created_at: string
}

export interface AdminDashboard {
  total_organizations: number
  pending_organizations: number
  approved_organizations: number
  suspended_organizations: number
  pending_change_requests: number
  ledger_entry_count: number
  ledger_amount_sum: string | number
}
