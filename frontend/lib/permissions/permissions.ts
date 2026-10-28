/**
 * Fine-grained Role-Based Access Control (RBAC) definitions and helpers for
 * Platform Administration and Merchant Salon Portals.
 */

export type PlatformPermission =
  | 'platform:dashboard:view'
  | 'platform:salons:view'
  | 'platform:salons:manage'
  | 'platform:requests:view'
  | 'platform:requests:review'
  | 'platform:reviews:moderate'
  | 'platform:commission:view'
  | 'platform:commission:manage'
  | 'platform:billing:view'
  | 'platform:billing:manage'
  | 'platform:taxonomy:view'
  | 'platform:taxonomy:manage'
  | 'platform:curation:view'
  | 'platform:curation:manage'
  | 'platform:staff:view'
  | 'platform:staff:manage'

export type MerchantPermission =
  | 'merchant:dashboard:view'
  | 'merchant:calendar:view'
  | 'merchant:calendar:manage'
  | 'merchant:appointments:view'
  | 'merchant:appointments:manage'
  | 'merchant:staff:view'
  | 'merchant:staff:manage'
  | 'merchant:services:view'
  | 'merchant:services:manage'
  | 'merchant:billing:view'
  | 'merchant:settings:view'
  | 'merchant:settings:manage'
  | 'merchant:profile:manage'

export const PLATFORM_ROLE_PERMISSIONS: Record<string, PlatformPermission[]> = {
  platform_admin: [
    'platform:dashboard:view',
    'platform:salons:view',
    'platform:salons:manage',
    'platform:requests:view',
    'platform:requests:review',
    'platform:reviews:moderate',
    'platform:commission:view',
    'platform:commission:manage',
    'platform:billing:view',
    'platform:billing:manage',
    'platform:taxonomy:view',
    'platform:taxonomy:manage',
    'platform:curation:view',
    'platform:curation:manage',
    'platform:staff:view',
    'platform:staff:manage',
  ],
  platform_staff: [
    'platform:dashboard:view',
    'platform:salons:view',
    'platform:requests:view',
    'platform:requests:review',
    'platform:reviews:moderate',
    'platform:taxonomy:view',
    'platform:taxonomy:manage',
    'platform:curation:view',
    'platform:curation:manage',
  ],
}

export const MERCHANT_ROLE_PERMISSIONS: Record<string, MerchantPermission[]> = {
  org_owner: [
    'merchant:dashboard:view',
    'merchant:calendar:view',
    'merchant:calendar:manage',
    'merchant:appointments:view',
    'merchant:appointments:manage',
    'merchant:staff:view',
    'merchant:staff:manage',
    'merchant:services:view',
    'merchant:services:manage',
    'merchant:billing:view',
    'merchant:settings:view',
    'merchant:settings:manage',
    'merchant:profile:manage',
  ],
  reception: [
    'merchant:dashboard:view',
    'merchant:calendar:view',
    'merchant:calendar:manage',
    'merchant:appointments:view',
    'merchant:appointments:manage',
    'merchant:staff:view',
    'merchant:services:view',
    'merchant:profile:manage',
  ],
  stylist: ['merchant:calendar:view', 'merchant:appointments:view', 'merchant:profile:manage'],
}

export const ADMIN_ROUTE_REQUIRED_PERMISSIONS: Record<string, PlatformPermission> = {
  '/admin': 'platform:dashboard:view',
  '/admin/salons': 'platform:salons:view',
  '/admin/requests': 'platform:requests:view',
  '/admin/reviews': 'platform:reviews:moderate',
  '/admin/commission': 'platform:commission:manage',
  '/admin/billing': 'platform:billing:view',
  '/admin/taxonomy': 'platform:taxonomy:view',
  '/admin/curation': 'platform:curation:view',
  '/admin/staff': 'platform:staff:view',
}

export const MERCHANT_ROUTE_REQUIRED_PERMISSIONS: Record<string, MerchantPermission> = {
  '/merchant': 'merchant:dashboard:view',
  '/merchant/calendar': 'merchant:calendar:view',
  '/merchant/appointments': 'merchant:appointments:view',
  '/merchant/staff': 'merchant:staff:view',
  '/merchant/services': 'merchant:services:view',
  '/merchant/billing': 'merchant:billing:view',
  '/merchant/settings': 'merchant:settings:view',
  '/merchant/settings/hours': 'merchant:settings:view',
  '/merchant/settings/paypal': 'merchant:settings:view',
  '/merchant/settings/policies': 'merchant:settings:view',
  '/merchant/settings/billing': 'merchant:settings:view',
  '/merchant/profile': 'merchant:profile:manage',
}

export function hasPlatformPermission(
  role: string | undefined | null,
  permission: PlatformPermission,
): boolean {
  if (!role) return false
  const permissions = PLATFORM_ROLE_PERMISSIONS[role.toLowerCase()]
  return Boolean(permissions?.includes(permission))
}

export function hasMerchantPermission(
  role: string | undefined | null,
  permission: MerchantPermission,
): boolean {
  if (!role) return false
  const permissions = MERCHANT_ROLE_PERMISSIONS[role.toLowerCase()]
  return Boolean(permissions?.includes(permission))
}

export function canAccessAdminRoute(role: string | undefined | null, pathname: string): boolean {
  if (!role) return false
  // Find matching route or prefix
  const matchedRoute = Object.keys(ADMIN_ROUTE_REQUIRED_PERMISSIONS)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname === route || pathname.startsWith(`${route}/`))

  if (!matchedRoute) return true
  const required = ADMIN_ROUTE_REQUIRED_PERMISSIONS[matchedRoute]
  return hasPlatformPermission(role, required)
}

export function canAccessMerchantRoute(role: string | undefined | null, pathname: string): boolean {
  if (!role) return false
  const normalized = pathname.replace(/^\/org/, '/merchant')
  const matchedRoute = Object.keys(MERCHANT_ROUTE_REQUIRED_PERMISSIONS)
    .sort((a, b) => b.length - a.length)
    .find((route) => normalized === route || normalized.startsWith(`${route}/`))

  if (!matchedRoute) return true
  const required = MERCHANT_ROUTE_REQUIRED_PERMISSIONS[matchedRoute]
  return hasMerchantPermission(role, required)
}

export function getDefaultMerchantRouteForRole(role: string | undefined | null): string {
  if (role === 'stylist') return '/merchant/calendar'
  return '/merchant'
}
