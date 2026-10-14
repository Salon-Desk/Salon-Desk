import {
  INITIAL_MERCHANT_AUDIT_LEDGER,
  INITIAL_MERCHANT_BOOKINGS,
  INITIAL_MERCHANT_CHANGE_REQUESTS,
  INITIAL_MERCHANT_SALON,
  INITIAL_MERCHANT_SERVICES,
  INITIAL_MERCHANT_STAFF,
  type MerchantSalonInfo,
} from "@/lib/data/merchant";
import type {
  AuditLedgerEntry,
  Booking,
  ChangeRequest,
  SalonService,
  StaffMember,
} from "@/types";
import { createPersistentStore } from "./create-persistent-store";

export interface MerchantConsoleState {
  authenticated: boolean;
  salon: MerchantSalonInfo;
  bookings: Booking[];
  staff: StaffMember[];
  services: SalonService[];
  changeRequests: ChangeRequest[];
  auditLedger: AuditLedgerEntry[];
  lastReconciledAt: string;
  simulatedDrift: boolean;
}

export function seedMerchantState(): MerchantConsoleState {
  return {
    // Pre-authenticated so reviewers land straight in the console.
    authenticated: true,
    salon: INITIAL_MERCHANT_SALON,
    bookings: INITIAL_MERCHANT_BOOKINGS,
    staff: INITIAL_MERCHANT_STAFF,
    services: INITIAL_MERCHANT_SERVICES,
    changeRequests: INITIAL_MERCHANT_CHANGE_REQUESTS,
    auditLedger: INITIAL_MERCHANT_AUDIT_LEDGER,
    lastReconciledAt: "12 seconds ago",
    simulatedDrift: false,
  };
}

export const merchantStore = createPersistentStore<MerchantConsoleState>(
  "salondesk:merchant-console:v3",
  seedMerchantState,
);
