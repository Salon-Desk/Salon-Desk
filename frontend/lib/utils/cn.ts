import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Resolve a public asset path against an optional base path. */
export function getPublicAbsoluteURL(path: string): string {
  if (!path) {
    return path
  }
  if (/^(https?:|data:|blob:)/.test(path)) {
    return path
  }
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}
