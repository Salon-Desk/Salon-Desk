import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

import { type AppPortal, clearPortalAuthSession, getPortalAuthToken } from './authSession'
import { NEXT_PUBLIC_BASE_URL } from './env'
import { getItemFromLocalDb } from './localDb'

const isServer = typeof window === 'undefined'
const configuredApiUrl = (
  NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'
).replace(/\/$/, '')

/**
 * Browser: prefer same-origin (empty baseURL) so nginx can proxy `/api/v1`
 * and CORS is never involved. Absolute URLs are only kept for true cross-origin APIs.
 */
function resolveBrowserBaseUrl(url: string): string {
  if (!url || /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(url)) {
    return ''
  }
  if (typeof window === 'undefined') {
    return url
  }
  try {
    const absolute =
      url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    if (new URL(absolute).origin === window.location.origin) {
      return ''
    }
  } catch {
    return ''
  }
  return url
}

const baseURL = isServer ? configuredApiUrl : resolveBrowserBaseUrl(configuredApiUrl)

export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000
export const UPLOAD_REQUEST_TIMEOUT_MS = 90_000

const axiosInstance = axios.create({
  baseURL,
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  withCredentials: true,
})

// Determine portal from browser URL (client, merchant, or admin)
export function detectPortal(): AppPortal {
  if (typeof window === 'undefined') return 'client'
  const path = window.location.pathname
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/merchant') || path.startsWith('/org')) return 'merchant'

  try {
    const searchParams = new URLSearchParams(window.location.search)
    const portalParam = searchParams.get('portal')
    if (portalParam === 'admin' || portalParam === 'merchant' || portalParam === 'client') {
      return portalParam
    }
  } catch {
    // ignore
  }

  const stored = getItemFromLocalDb('current_app_portal')
  if (stored === 'admin' || stored === 'merchant' || stored === 'client') {
    return stored as AppPortal
  }
  return 'client'
}

/**
 * Accurately resolve which portal a request belongs to:
 * 1. Explicit X-App-Portal header
 * 2. Target API endpoint prefix (/admin, /organizations, /catalog, etc.)
 * 3. Fallback to browser route (detectPortal)
 */
export function resolveRequestPortal(url?: string, explicitHeader?: string): AppPortal {
  if (explicitHeader === 'admin' || explicitHeader === 'merchant' || explicitHeader === 'client') {
    return explicitHeader
  }
  if (url) {
    if (url.includes('/admin') || url.startsWith('/api/v1/admin')) {
      return 'admin'
    }
    if (
      url.includes('/organizations') ||
      url.includes('/settlements') ||
      url.startsWith('/api/v1/organizations') ||
      url.startsWith('/api/v1/settlements')
    ) {
      return 'merchant'
    }
    if (
      url.includes('/catalog') ||
      url.includes('/bookings') ||
      url.includes('/payments') ||
      url.includes('/chat') ||
      url.includes('/livekit') ||
      url.includes('/ai')
    ) {
      return 'client'
    }
  }
  return detectPortal()
}

// ------------------ REQUEST INTERCEPTOR ------------------
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isPublicAuthRoute =
      config.url?.includes('/auth/sign-in') ||
      config.url?.includes('/auth/sign-up') ||
      config.url?.includes('/auth/forgot-password') ||
      config.url?.includes('/auth/reset-password')

    const currentPortal = resolveRequestPortal(
      config.url,
      config.headers?.get?.('X-App-Portal') as string | undefined,
    )
    config.headers.set('X-App-Portal', currentPortal)

    const token = getPortalAuthToken(currentPortal)
    const hasAuthHeader = config.headers?.get?.('Authorization') !== undefined

    // Send bearer token if available and not already set
    if (!isPublicAuthRoute && !hasAuthHeader && token && token.length > 5) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }

    // FormData: omit Content-Type so browser sets boundary
    if (config.data instanceof FormData) {
      config.headers.delete('Content-Type')
      if (config.timeout === DEFAULT_REQUEST_TIMEOUT_MS) {
        config.timeout = UPLOAD_REQUEST_TIMEOUT_MS
      }
    } else {
      if (!config.headers.has('Content-Type')) {
        config.headers.set('Content-Type', 'application/json')
      }
      config.headers.set('Accept', 'application/json')
    }

    return config
  },
  (error) => Promise.reject(error),
)

// ------------------ RESPONSE INTERCEPTOR ------------------
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    // If 401 Unauthorized, session token is expired or invalid
    if (error?.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const isAuthAttempt =
          error?.config?.url?.includes('/auth/sign-in') ||
          error?.config?.url?.includes('/auth/sign-up')

        // Only clear and notify if this was an active session call, not an invalid login attempt
        if (!isAuthAttempt) {
          const rawHeader =
            (error?.config?.headers?.get?.('X-App-Portal') as string | undefined) ||
            (error?.config?.headers?.['X-App-Portal'] as string | undefined)
          const targetPortal = resolveRequestPortal(error?.config?.url, rawHeader)
          clearPortalAuthSession(targetPortal)
          window.dispatchEvent(
            new CustomEvent('salondesk:unauthorized', { detail: { portal: targetPortal } }),
          )
        }
      }
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
