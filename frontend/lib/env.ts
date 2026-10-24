export const NEXT_PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const NEXT_PUBLIC_APP_PUBLIC_GOOGLE_CLIENT = process.env.NEXT_PUBLIC_APP_PUBLIC_GOOGLE_CLIENT

export const NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const NEXT_PUBLIC_PAYMENT_METHOD = process.env.NEXT_PUBLIC_PAYMENT_METHOD || 'PAYPAL'

export const NEXT_PUBLIC_GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export const NEXT_PUBLIC_CLIENT_SITE_URL =
  process.env.NEXT_PUBLIC_CLIENT_SITE_URL || NEXT_PUBLIC_SITE_URL

/** LiveKit Cloud URL (same project as the voice worker). Token still comes from the API. */
export const NEXT_PUBLIC_LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || ''

/** Build an absolute URL on the client/portal site. */
export function withClientSiteUrl(path: string): string {
  const base = NEXT_PUBLIC_CLIENT_SITE_URL.replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}
