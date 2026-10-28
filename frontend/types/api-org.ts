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

export interface AdminOrgOwner {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  status: string
  role: string
  created_at?: string | null
}

export interface AdminOrgPaypal {
  id?: string | null
  merchant_id?: string | null
  merchant_email?: string | null
  display_name?: string | null
  currency: string
  status?: string | null
  approved_at?: string | null
  created_at?: string | null
}

export interface AdminOrgServiceItem {
  id: string
  name: string
  category_name?: string | null
  base_price: string | number
  duration_minutes: number
  status: string
  simultaneous_capacity: number
}

export interface AdminOrgStaffItem {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  picture?: string | null
  phone?: string | null
}

export interface AdminOrganizationDetail {
  id: string
  owner_id: string
  name: string
  status: ApiOrgStatus
  description?: string | null
  picture?: string | null
  created_at: string
  owner?: AdminOrgOwner | null
  paypal_account?: AdminOrgPaypal | null
  physical_address?: string | null
  timezone?: string | null
  lat?: string | number | null
  lng?: string | number | null
  working_hours?: WorkingHoursMap | null
  cancellation_policy?: {
    org_id: string
    name: string
    free_cancel_hours: number
    no_show_fee_percent: number
    late_cancel_fee_percent?: number | null
    data: Record<string, unknown>
  } | null
  rating_avg: number
  review_count: number
  services_count: number
  staff_count: number
  services: AdminOrgServiceItem[]
  staff: AdminOrgStaffItem[]
}

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export type TimeInterval = [string, string]
export type WorkingHoursMap = Record<DayKey, TimeInterval[]>

export interface ApiOrgSettings {
  id: string
  org_id: string
  timezone: string
  physical_address: string
  lat?: string | number | null
  lng?: string | number | null
  working_hours: WorkingHoursMap
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
  org_name?: string | null
  submitter_name?: string | null
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
  rating_avg?: number
  review_count?: number
  working_hours?: WorkingHoursMap | null
  distance_km?: number | null
}

export interface CatalogHero {
  eyebrow: string
  headline: string
  highlight: string
  subtitle: string
  image_url?: string | null
  image_alt: string
  organization_id?: string | null
  organization_name?: string | null
  physical_address?: string | null
  salon_count: number
  service_count: number
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
  distance_km?: number | null
  platform_commission_amount?: string | number | null
  authorization_hold_amount?: string | number | null
  rating_avg?: number | null
  review_count?: number
  is_featured?: boolean
  featured_badge?: string | null
}

export type CatalogServiceSort =
  'name' | 'popular' | 'rating' | 'price_asc' | 'price_desc' | 'duration' | 'distance'

export interface CatalogServicesQueryParams {
  page?: number
  page_size?: number
  category_id?: string
  org_id?: string
  q?: string
  sort?: CatalogServiceSort
  min_price?: number
  max_price?: number
  min_rating?: number
  lat?: number
  lng?: number
  max_distance_km?: number
}

export interface ApiPage<T> {
  items: T[]
  page: number
  page_size: number
  total: number
  has_more: boolean
}

export function normalizePaginated<T>(
  data: ApiPage<T> | T[] | undefined | null,
  fallbackPage = 1,
  fallbackPageSize = 20,
): ApiPage<T> {
  if (!data) {
    return { items: [], page: fallbackPage, page_size: fallbackPageSize, total: 0, has_more: false }
  }
  if (Array.isArray(data)) {
    return {
      items: data,
      page: fallbackPage,
      page_size: data.length || fallbackPageSize,
      total: data.length,
      has_more: false,
    }
  }
  return data
}

export type CatalogServicesPage = ApiPage<CatalogService>

export interface ApiServiceCategory {
  id: string
  name: string
  description?: string | null
  status?: 'ACTIVE' | 'INACTIVE' | string
  active_organizations_count?: number
  active_services_count?: number
  created_at: string
}

export interface CreateServiceCategoryRequest {
  name: string
  description?: string | null
  status?: 'ACTIVE' | 'INACTIVE' | string
}

export interface UpdateServiceCategoryRequest {
  name?: string
  description?: string | null
  status?: 'ACTIVE' | 'INACTIVE' | string
}

export interface TaxonomyMetrics {
  total_categories: number
  active_categories: number
  total_active_organizations: number
  total_active_services: number
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

export type CommissionRecordStatus = 'ACCRUED' | 'INVOICED' | 'PAID' | 'WAIVED' | string
export type OrgCommissionInvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'VOID' | string

export interface CommissionRecord {
  id: string
  org_id: string
  booking_id: string
  capture_id: string
  invoice_id?: string | null
  gross_captured_amount: string | number
  applied_rate_json: Record<string, unknown>
  platform_commission_amount: string | number
  net_org_amount: string | number
  currency: string
  status: CommissionRecordStatus
  created_at: string
  updated_at: string
}

export interface OrgCommissionInvoice {
  id: string
  org_id: string
  period_start: string
  period_end: string
  total_gross_volume: string | number
  total_commission_due: string | number
  currency: string
  paypal_invoice_or_order_id?: string | null
  status: OrgCommissionInvoiceStatus
  due_date: string
  paid_at?: string | null
  created_at: string
  updated_at: string
}

export interface GenerateCommissionInvoiceRequest {
  org_id: string
  period_start: string
  period_end: string
  due_date?: string | null
  currency?: string
}

export interface PayCommissionInvoiceRequest {
  paypal_invoice_or_order_id?: string | null
}

export interface AdminDashboard {
  total_organizations: number
  pending_organizations: number
  approved_organizations: number
  suspended_organizations: number
  pending_change_requests: number
  pending_client_feedback?: number
  ledger_entry_count: number
  ledger_amount_sum: string | number
}

/* ── Org account / policy / shift shapes ── */

export interface ApiOrgAccount {
  id: string
  org_id: string
  merchant_id: string
  merchant_email?: string | null
  display_name: string
  currency: string
  status: string
  approved_at?: string | null
  org_name?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ApiCancellationPolicy {
  id: string
  org_id: string
  name: string
  status: string
  data: {
    free_cancel_hours?: number
    no_show_fee_percent?: number
    late_cancel_fee_percent?: number
    hold_percent?: number
    no_show_fee?: number
    policyHours?: number
    noShowFee?: number
    [key: string]: unknown
  }
  org_name?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ApiOrgShift {
  id: string
  org_id: string
  name: string
  data: Record<string, unknown>
}

export interface ApiOrgEmployeeShift {
  id: string
  user_id: string
  org_shift_id: string
  days?: string[]
  created_at: string
  employee_name?: string | null
  employee_email?: string | null
  shift_name?: string | null
  shift_data?: Record<string, unknown> | null
}

export interface ApiOrgEmployeeTimeOff {
  id: string
  org_id: string
  user_id: string
  start_date: string
  end_date: string
  reason?: string | null
  created_at: string
  employee_name?: string | null
  employee_email?: string | null
}

export interface ApiEmployeeCategory {
  id: string
  name: string
  description?: string | null
}

export interface HeroSettings {
  eyebrow: string
  headline: string
  highlight: string
  subtitle: string
  image_url?: string | null
  image_alt: string
  organization_id?: string | null
  organization_name?: string | null
  physical_address?: string | null
  salon_count: number
  service_count: number
  is_active: boolean
}

export interface UpdateHeroSettingsRequest {
  eyebrow?: string
  headline?: string
  highlight?: string
  subtitle?: string
  image_url?: string | null
  image_alt?: string
  organization_id?: string | null
  is_active?: boolean
}

export interface HeroImageUploadResponse {
  image_url: string
  hero: HeroSettings
}

export interface PopularSettings {
  min_rating: number
  org_weight: number
  service_weight: number
}

export interface UpdatePopularSettingsRequest {
  min_rating?: number
  org_weight?: number
  service_weight?: number
}

export interface FeaturedOrganization {
  id: string
  item_id: string
  badge_text: string
  display_order: number
  is_active: boolean
  organization: CatalogOrganization
}

export interface FeaturedService {
  id: string
  item_id: string
  badge_text: string
  display_order: number
  is_active: boolean
  service: CatalogService
}

export interface CatalogCuration {
  hero: CatalogHero
  featured_organizations: FeaturedOrganization[]
  featured_services: FeaturedService[]
}

export interface AdminCuration {
  hero: HeroSettings
  popular_settings: PopularSettings
  featured_organizations: FeaturedOrganization[]
  featured_services: FeaturedService[]
}

export interface CreateFeaturedItemRequest {
  target_type: 'organization' | 'service'
  target_id: string
  badge_text: string
  display_order?: number
  is_active?: boolean
}

export interface UpdateFeaturedItemRequest {
  badge_text?: string
  display_order?: number
  is_active?: boolean
}
