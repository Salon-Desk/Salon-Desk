export { AdminAuthModal } from './_components/AdminAuthModal'
export {
  ADMIN_DEMO_EMAIL,
  ADMIN_DEMO_PASSWORD,
  EMPTY_CATEGORY_FORM,
  EMPTY_SALON_FORM,
  EMPTY_STAFF_FORM,
} from './_constants/admin-forms'
export {
  ADMIN_NAV_GROUPS,
  ADMIN_TAB_LABELS,
  ADMIN_TAB_ROUTES,
  ADMIN_TAB_SUBTITLES,
  ADMIN_TAB_TITLES,
  getAdminTabFromPathname,
} from './_constants/admin-nav'
export { type AdminContextValue, AdminProvider, useAdminContext } from './_context/admin-context'
export type { AdminTabId, CrSubTab, SalonStatusFilter } from './_types/admin-types'
export { computeAdminMetrics } from './_utils/compute-admin-metrics'
