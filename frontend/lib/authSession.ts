import { ACCESS_TOKEN, ACCESS_TOKEN_TYPE, AUTH_USER, REFRESH_TOKEN } from '@/constant/variables'
import type { User } from '@/types/user'

import { clearItemsFrommLocalDb, getItemFromLocalDb, setItemLocalDb } from './localDb'

export const AUTH_KEYS = [
  ACCESS_TOKEN,
  ACCESS_TOKEN_TYPE,
  REFRESH_TOKEN,
  AUTH_USER,
  'current_app_portal',
]

/**
 * Clear all auth session tokens and cached user data from localStorage
 */
export const clearClientAuthSession = (): void => {
  clearItemsFrommLocalDb(AUTH_KEYS)
}

/**
 * Save token and user into localStorage
 */
export const saveClientAuthSession = (token: string, user?: User | null, portal?: string): void => {
  setItemLocalDb(ACCESS_TOKEN, token)
  setItemLocalDb(ACCESS_TOKEN_TYPE, 'login')
  if (user) {
    setItemLocalDb(AUTH_USER, JSON.stringify(user))
  }
  if (portal) {
    setItemLocalDb('current_app_portal', portal)
  }
}

/**
 * Read current token from localStorage
 */
export const getClientAuthToken = (): string | null => {
  return getItemFromLocalDb(ACCESS_TOKEN)
}

/**
 * Read current user from localStorage
 */
export const getClientAuthUser = (): User | null => {
  const raw = getItemFromLocalDb(AUTH_USER)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

/** Default post-login path for a user role. */
export const pathForUserRole = (role?: string | null): string => {
  if (!role) return '/client'
  if (role === 'platform_admin' || role === 'platform_staff') return '/admin'
  if (role === 'org_owner' || role === 'reception' || role === 'stylist') {
    return '/merchant'
  }
  return '/client'
}
