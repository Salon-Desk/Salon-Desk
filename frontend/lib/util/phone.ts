import parsePhoneNumberFromString from 'libphonenumber-js'

import { normalizePhoneDigits } from '@/lib/schema/common'

export function toPhoneFieldValue(value?: string | null): string {
  if (!value) {
    return ''
  }
  const trimmed = value.trim()
  const parsed = parsePhoneNumberFromString(trimmed.startsWith('+') ? trimmed : `+${trimmed}`)
  return parsed?.number ?? trimmed.replace(/\D/g, '')
}

export function phonesEqual(a?: string | null, b?: string | null): boolean {
  return toPhoneFieldValue(a) === toPhoneFieldValue(b)
}

export function isValidPhoneValue(value?: string | null, required = true): boolean {
  if (!value) {
    return !required
  }
  const trimmed = value.trim()
  const parsed = parsePhoneNumberFromString(trimmed.startsWith('+') ? trimmed : `+${trimmed}`)
  return parsed?.isValid() ?? false
}

/** Digits-only payload for API bodies (empty → undefined). */
export function toApiPhoneDigits(value?: string | null): string | undefined {
  const digits = normalizePhoneDigits(value)
  return digits || undefined
}
