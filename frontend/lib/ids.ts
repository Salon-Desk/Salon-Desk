/**
 * Demo identifier generators. A module-level counter keeps generated ids unique
 * and monotonic within a session without pulling in a uuid dependency.
 */
let sequence = 0

function nextSequence(): number {
  sequence += 1
  return sequence
}

export function createSequentialId(prefix: string): string {
  return `${prefix}-${nextSequence()}`
}

export function createBookingId(): string {
  return `SD-${Math.floor(1000 + Math.random() * 9000)}`
}

export function createLedgerId(): string {
  return `LEDGER-${Math.floor(100 + Math.random() * 900)}`
}

export function createPaypalDebugId(scope = 'REQ'): string {
  return `DEBUG_${scope}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`
}

export function createPaypalAuthId(): string {
  return `AUTH-PP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
}

export function createConsentHash(seed: string): string {
  const entropy = Math.random().toString(36).slice(2)
  return `sha256:${entropy}${seed.toLowerCase().replace(/[^a-z0-9]/g, '')}99f2b8`
}

export function createIdempotencyKey(bookingId: string, operation: string): string {
  return `IDEMP_${bookingId}_${operation.toUpperCase()}`
}
