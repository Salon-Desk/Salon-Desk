import { getPublicAbsoluteURL } from '@/lib/utils'

export function isRemoteImageSrc(src?: string | null): boolean {
  if (!src) {
    return false
  }
  return /^(https?:|data:|blob:)/.test(src)
}

export function shouldUnoptimizeImage(src?: string | null): boolean {
  if (!src) {
    return false
  }
  // Absolute upload URLs are loaded by the browser. The Next image optimizer
  // fetches them from inside the web container, which cannot reach localhost
  // or the public site the same way the browser can.
  return src.startsWith('blob:') || src.startsWith('data:') || isRemoteImageSrc(src)
}

export function resolveImageSrc(src?: string | null, fallback = ''): string {
  const resolved = src?.trim() ? src : fallback
  if (!resolved) {
    return ''
  }
  if (isRemoteImageSrc(resolved) || resolved.startsWith('/')) {
    return getPublicAbsoluteURL(resolved)
  }
  return getPublicAbsoluteURL(`/${resolved}`)
}
