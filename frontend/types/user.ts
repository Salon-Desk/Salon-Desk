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
}

export interface User {
  id: string
  email: string
  status: UserStatus | string
  role: UserRole
  org_id?: string | null
  created_at?: string
  profile?: Profile | null
  // Convenient direct properties
  first_name?: string
  last_name?: string
  name?: string
  phone?: string | null
}

export interface ProfileUpdatePayload {
  first_name?: string
  last_name?: string
  middle_name?: string | null
  picture?: string | null
  phone?: string | null
}
