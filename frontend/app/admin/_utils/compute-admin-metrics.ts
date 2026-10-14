import type { AdminDashboardState } from "@/lib/store";

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
