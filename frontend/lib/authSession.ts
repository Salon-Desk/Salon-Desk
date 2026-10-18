import {
  ACCESS_TOKEN,
  ACCESS_TOKEN_TYPE,
  ADMIN_ACCESS_TOKEN,
  ADMIN_ACCESS_TOKEN_TYPE,
  ADMIN_AUTH_USER,
  ADMIN_REFRESH_TOKEN,
  AUTH_USER,
  CLIENT_ACCESS_TOKEN,
  CLIENT_ACCESS_TOKEN_TYPE,
  CLIENT_AUTH_USER,
  CLIENT_REFRESH_TOKEN,
  MERCHANT_ACCESS_TOKEN,
  MERCHANT_ACCESS_TOKEN_TYPE,
  MERCHANT_AUTH_USER,
  MERCHANT_REFRESH_TOKEN,
  REFRESH_TOKEN,
} from '@/constant/variables'
import type { User } from '@/types/user'

import { clearItemsFrommLocalDb, getItemFromLocalDb, setItemLocalDb } from './localDb'

export type AppPortal = 'client' | 'merchant' | 'admin'

export interface PortalStorageKeys {
  accessToken: string
  tokenType: string
  refreshToken: string
  authUser: string
}

export const PORTAL_STORAGE_KEYS: Record<AppPortal, PortalStorageKeys> = {
  client: {
    accessToken: CLIENT_ACCESS_TOKEN,
    tokenType: CLIENT_ACCESS_TOKEN_TYPE,
    refreshToken: CLIENT_REFRESH_TOKEN,
    authUser: CLIENT_AUTH_USER,
  },
  merchant: {
    accessToken: MERCHANT_ACCESS_TOKEN,
    tokenType: MERCHANT_ACCESS_TOKEN_TYPE,
    refreshToken: MERCHANT_REFRESH_TOKEN,
    authUser: MERCHANT_AUTH_USER,
  },
  admin: {
    accessToken: ADMIN_ACCESS_TOKEN,
    tokenType: ADMIN_ACCESS_TOKEN_TYPE,
    refreshToken: ADMIN_REFRESH_TOKEN,
    authUser: ADMIN_AUTH_USER,
  },
}

export const AUTH_KEYS = [
  ACCESS_TOKEN,
  ACCESS_TOKEN_TYPE,
  REFRESH_TOKEN,
  AUTH_USER,
  CLIENT_ACCESS_TOKEN,
  CLIENT_ACCESS_TOKEN_TYPE,
  CLIENT_REFRESH_TOKEN,
  CLIENT_AUTH_USER,
  MERCHANT_ACCESS_TOKEN,
  MERCHANT_ACCESS_TOKEN_TYPE,
  MERCHANT_REFRESH_TOKEN,
  MERCHANT_AUTH_USER,
  ADMIN_ACCESS_TOKEN,
  ADMIN_ACCESS_TOKEN_TYPE,
  ADMIN_REFRESH_TOKEN,
  ADMIN_AUTH_USER,
  'current_app_portal',
]

/**
 * Save auth token and user into localStorage for a specific app portal
 */
export const savePortalAuthSession = (
  portal: AppPortal,
  token: string,
  user?: User | null,
): void => {
  const keys = PORTAL_STORAGE_KEYS[portal]
  setItemLocalDb(keys.accessToken, token)
  setItemLocalDb(keys.tokenType, 'login')
  if (user) {
    setItemLocalDb(keys.authUser, JSON.stringify(user))
  }
  setItemLocalDb('current_app_portal', portal)

  // Maintain legacy keys for client portal or general consumers
  if (portal === 'client') {
    setItemLocalDb(ACCESS_TOKEN, token)
    setItemLocalDb(ACCESS_TOKEN_TYPE, 'login')
    if (user) {
      setItemLocalDb(AUTH_USER, JSON.stringify(user))
    }
  }
}

/**
 * Read current token for a specific portal from localStorage
 */
export const getPortalAuthToken = (portal: AppPortal): string | null => {
  const keys = PORTAL_STORAGE_KEYS[portal]
  const token = getItemFromLocalDb(keys.accessToken)
  if (!token && portal === 'client') {
    return getItemFromLocalDb(ACCESS_TOKEN)
  }
  return token
}

/**
 * Read current user for a specific portal from localStorage
 */
export const getPortalAuthUser = (portal: AppPortal): User | null => {
  const keys = PORTAL_STORAGE_KEYS[portal]
  let raw = getItemFromLocalDb(keys.authUser)
  if (!raw && portal === 'client') {
    raw = getItemFromLocalDb(AUTH_USER)
  }
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

/**
 * Clear auth session tokens and user data for a specific portal from localStorage
 */
export const clearPortalAuthSession = (portal: AppPortal): void => {
  const keys = PORTAL_STORAGE_KEYS[portal]
  const toClear = [keys.accessToken, keys.tokenType, keys.refreshToken, keys.authUser]
  if (portal === 'client') {
    toClear.push(ACCESS_TOKEN, ACCESS_TOKEN_TYPE, REFRESH_TOKEN, AUTH_USER)
  }
  clearItemsFrommLocalDb(toClear)
}

/**
 * Clear all auth session tokens and cached user data for all portals
 */
export const clearAllAuthSessions = (): void => {
  clearItemsFrommLocalDb(AUTH_KEYS)
}

/**
 * Legacy shim: Clear auth session (portal-aware or all)
 */
export const clearClientAuthSession = (portal?: AppPortal): void => {
  if (portal) {
    clearPortalAuthSession(portal)
  } else {
    clearAllAuthSessions()
  }
}

/**
 * Legacy shim: Save token and user into localStorage
 */
export const saveClientAuthSession = (token: string, user?: User | null, portal?: string): void => {
  const targetPortal: AppPortal = portal === 'admin' || portal === 'merchant' ? portal : 'client'
  savePortalAuthSession(targetPortal, token, user)
}

/**
 * Legacy shim: Read token from localStorage (optional portal)
 */
export const getClientAuthToken = (portal?: AppPortal): string | null => {
  if (portal) return getPortalAuthToken(portal)
  return getPortalAuthToken('client') || getItemFromLocalDb(ACCESS_TOKEN)
}

/**
 * Legacy shim: Read current user from localStorage (optional portal)
 */
export const getClientAuthUser = (portal?: AppPortal): User | null => {
  if (portal) return getPortalAuthUser(portal)
  return getPortalAuthUser('client')
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
