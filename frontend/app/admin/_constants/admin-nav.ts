import type { AdminTabId } from "../_types/admin-types";

export const ADMIN_NAV_GROUPS = [
  "Overview",
  "Network",
  "Finance",
  "Platform",
] as const;

export const ADMIN_TAB_TITLES: Record<AdminTabId, string> = {
  overview: "Overview",
  salons: "Salons",
  requests: "Approvals",
  commission: "Commission",
  taxonomy: "Categories",
  staff: "Staff",
};

export const ADMIN_TAB_LABELS: Record<AdminTabId, string> = {
  overview: "Overview",
  salons: "Salons",
  requests: "Approvals",
  commission: "Commission",
  taxonomy: "Categories",
  staff: "Staff",
};
