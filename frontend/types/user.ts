export type UserRole =
  'client' | 'org_owner' | 'reception' | 'stylist' | 'platform_admin' | 'platform_staff'

export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface Profile {
  id?: string
  user_id?: string
  first_name: string
  last_name: string
  middle_name?: string | null
  picture?: string | null
  phone?: string | null
  handle?: string | null
}

export interface User {
  id: string
  email: string
  status: UserStatus | string
  role: UserRole
  org_id?: string | null
  email_verified_at?: string | null
  created_at?: string
  profile?: Profile | null
  // Convenient direct properties
  first_name?: string
  last_name?: string
  name?: string
  phone?: string | null
  handle?: string | null
  category_ids?: string[]
}

export interface ProfileUpdatePayload {
  first_name?: string
  last_name?: string
  middle_name?: string | null
  picture?: string | null
  phone?: string | null
  handle?: string | null
}

/* ── Employee / staff request shapes ── */

export interface CreateEmployeeRequest {
  email: string
  password?: string
  first_name: string
  last_name: string
  role: 'reception' | 'stylist'
  middle_name?: string | null
  phone?: string | null
  handle?: string | null
  category_ids?: string[]
}

export interface UpdateEmployeeRequest {
  first_name?: string
  last_name?: string
  middle_name?: string | null
  phone?: string | null
  role?: 'reception' | 'stylist'
  picture?: string | null
  handle?: string | null
  category_ids?: string[]
}

export interface CreateStaffRequest {
  email: string
  password?: string
  first_name: string
  last_name: string
  middle_name?: string | null
  phone?: string | null
}

export interface AssignShiftRequest {
  user_id: string
  org_shift_id: string
  days?: string[]
}
