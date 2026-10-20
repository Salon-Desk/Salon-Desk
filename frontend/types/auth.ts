import type { Profile, User, UserRole } from './user'

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface OrgOwnerSignUpResponse extends TokenResponse {
  organization_id: string
}

export interface MeResponse {
  user: User
  profile: Profile | null
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  middle_name?: string | null
  phone?: string | null
}

export interface OrgOwnerSignUpRequest extends SignUpRequest {
  organization_name: string
  organization_description?: string | null
  timezone?: string
  physical_address: string
  lat?: number | null
  lng?: number | null
  working_hours?: Record<string, [string, string][]>
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  detail: string
  reset_token?: string | null
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface ResendVerificationRequest {
  email: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface MessageOut {
  detail: string
}

export interface LocalAuthData {
  user: User
  token: string
  roles: UserRole[]
}
