import {
  INITIAL_ADMIN_ORGS,
  INITIAL_CHANGE_REQUESTS,
  INITIAL_COMMISSION_OVERRIDES,
  INITIAL_COMMISSION_TRANSACTIONS,
  INITIAL_PLATFORM_USERS,
  INITIAL_TAXONOMY_CATEGORIES,
} from "@/lib/data/admin";
import type {
  ChangeRequest,
  CommissionOverride,
  CommissionTransaction,
  Organization,
  PlatformUser,
  TaxonomyCategory,
} from "@/types";
import { createPersistentStore } from "./create-persistent-store";

export interface AdminDashboardState {
  organizations: Organization[];
  changeRequests: ChangeRequest[];
  globalRate: { percentage: number; flatFee: number };
  commissionOverrides: CommissionOverride[];
  commissionTransactions: CommissionTransaction[];
  categories: TaxonomyCategory[];
  platformUsers: PlatformUser[];
  authenticated: boolean;
  currentUser: PlatformUser;
}

export function seedAdminState(): AdminDashboardState {
  return {
    organizations: INITIAL_ADMIN_ORGS,
    changeRequests: INITIAL_CHANGE_REQUESTS,
    globalRate: { percentage: 2.5, flatFee: 0.3 },
    commissionOverrides: INITIAL_COMMISSION_OVERRIDES,
    commissionTransactions: INITIAL_COMMISSION_TRANSACTIONS,
    categories: INITIAL_TAXONOMY_CATEGORIES,
    platformUsers: INITIAL_PLATFORM_USERS,
    // Pre-authenticated so reviewers land straight in the dashboard.
    authenticated: true,
    currentUser: INITIAL_PLATFORM_USERS[0],
  };
}

export const adminStore = createPersistentStore<AdminDashboardState>(
  "salondesk:admin-dashboard:v2",
  seedAdminState,
);
