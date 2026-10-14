import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

import { ACCESS_TOKEN } from '@/constant/variables'

import { clearClientAuthSession } from './authSession'
import { getItemFromLocalDb } from './localDb'
import { NEXT_PUBLIC_BASE_URL } from './secreate'

const isServer = typeof window === 'undefined'
const apiBaseUrl = (
  NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'
).replace(/\/$/, '')

// FastAPI has CORS enabled for http://localhost:3000, so we can connect directly or via relative proxy
const baseURL = isServer ? apiBaseUrl : apiBaseUrl || ''

export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000
export const UPLOAD_REQUEST_TIMEOUT_MS = 90_000

const axiosInstance = axios.create({
  baseURL,
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  withCredentials: true,
})

// Determine portal (client, merchant, or admin)
function detectPortal(): 'client' | 'merchant' | 'admin' {
  if (typeof window === 'undefined') return 'client'
  const path = window.location.pathname
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/merchant') || path.startsWith('/org')) return 'merchant'
  return 'client'
}

// ------------------ REQUEST INTERCEPTOR ------------------
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isPublicAuthRoute =
      config.url?.includes('/auth/sign-in') ||
      config.url?.includes('/auth/sign-up') ||
      config.url?.includes('/auth/forgot-password') ||
      config.url?.includes('/auth/reset-password')

    const token = getItemFromLocalDb(ACCESS_TOKEN)
    const hasAuthHeader = config.headers?.get?.('Authorization') !== undefined

    // Send bearer token if available and not already set
    if (!isPublicAuthRoute && !hasAuthHeader && token && token.length > 5) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }

    // Set portal header based on current route or config
    const currentPortal = (config.headers?.get?.('X-App-Portal') as string) || detectPortal()
    config.headers.set('X-App-Portal', currentPortal)

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
          clearClientAuthSession()
          window.dispatchEvent(new CustomEvent('salondesk:unauthorized'))
        }
      }
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
