import { INITIAL_AUDIT_LEDGER, INITIAL_BOOKINGS } from '@/lib/data/bookings'
import { INITIAL_ORGANIZATIONS } from '@/lib/data/organizations'
import type { AuditLedgerEntry, Booking, Organization } from '@/types'

export interface ClientStoreState {
  bookings: Booking[]
  auditLedger: AuditLedgerEntry[]
  organizations: Organization[]
  lastResetAt: string
}

export function seedClientState(): ClientStoreState {
  return {
    bookings: INITIAL_BOOKINGS,
    auditLedger: INITIAL_AUDIT_LEDGER,
    organizations: INITIAL_ORGANIZATIONS,
    lastResetAt: new Date().toISOString(),
  }
}
