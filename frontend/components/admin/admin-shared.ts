import type { AdminDashboardState } from "@/lib/store";

export type AdminTabId =
  | "overview"
  | "salons"
  | "requests"
  | "commission"
  | "taxonomy"
  | "staff";

export type CrSubTab = "POLICY" | "PAYPAL";

export type SalonStatusFilter =
  | "ALL"
  | "APPROVED"
  | "PENDING_REVIEW"
  | "SUSPENDED";

export const ADMIN_NAV_GROUPS = [
  "Analytics & KPIs",
  "Salon Management",
  "Financial Rails",
  "Governance & Staff",
] as const;

export const ADMIN_TAB_TITLES: Record<AdminTabId, string> = {
  overview: "Platform Overview & Financial KPIs",
  salons: "Multi-Tenant Salon Directory",
  requests: "Merchant Change Request Queue",
  commission: "Platform Commission & Fee Rails",
  taxonomy: "Central Service Category Taxonomy",
  staff: "Platform Staff & RBAC Access",
};

export function computeAdminMetrics(state: AdminDashboardState) {
  const totalVolume = state.organizations.reduce(
    (acc, o) => acc + o.totalVolume,
    0,
  );
  const totalHolds = state.organizations.reduce(
    (acc, o) => acc + o.activeHoldsCount,
    0,
  );
  const activeCount = state.organizations.filter(
    (o) => o.status === "APPROVED",
  ).length;
  const pendingCount = state.organizations.filter(
    (o) => o.status === "PENDING_REVIEW",
  ).length;
  const suspendedCount = state.organizations.filter(
    (o) => o.status === "SUSPENDED",
  ).length;
  const pendingCrCount = state.changeRequests.filter(
    (r) => r.status === "PENDING_REVIEW",
  ).length;

  return {
    totalVolume,
    totalHolds,
    activeCount,
    pendingCount,
    suspendedCount,
    pendingCrCount,
  };
}
