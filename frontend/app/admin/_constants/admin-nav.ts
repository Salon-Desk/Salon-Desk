import type { AdminTabId } from '../_types/admin-types'

export const ADMIN_NAV_GROUPS = ['Overview', 'Network', 'Finance', 'Platform'] as const

export const ADMIN_TAB_TITLES: Record<AdminTabId, string> = {
  overview: 'Overview',
  salons: 'Salons',
  requests: 'Approvals',
  commission: 'Commission',
  taxonomy: 'Taxonomy',
  staff: 'Staff',
}

export const ADMIN_TAB_LABELS: Record<AdminTabId, string> = {
  overview: 'Overview',
  salons: 'Salons',
  requests: 'Approvals',
  commission: 'Commission',
  taxonomy: 'Taxonomy',
  staff: 'Staff',
}

export const ADMIN_TAB_SUBTITLES: Record<AdminTabId, string> = {
  overview: 'Network performance, authorization hold volume, and KPIs.',
  salons: 'Partner salon directory and PayPal credentials.',
  requests: 'Merchant policy and payout change requests.',
  commission: 'Platform take-rates, custom overrides, and split fee ledger.',
  taxonomy: 'Discovery categories and service classification.',
  staff: 'Internal platform administrator accounts and roles.',
}

export const ADMIN_TAB_ROUTES: Record<AdminTabId, string> = {
  overview: '/admin',
  salons: '/admin/salons',
  requests: '/admin/requests',
  commission: '/admin/commission',
  taxonomy: '/admin/taxonomy',
  staff: '/admin/staff',
}

export function getAdminTabFromPathname(pathname: string): AdminTabId {
  if (pathname.startsWith('/admin/salons')) return 'salons'
  if (pathname.startsWith('/admin/requests')) return 'requests'
  if (pathname.startsWith('/admin/commission')) return 'commission'
  if (pathname.startsWith('/admin/taxonomy')) return 'taxonomy'
  if (pathname.startsWith('/admin/staff')) return 'staff'
  return 'overview'
}
