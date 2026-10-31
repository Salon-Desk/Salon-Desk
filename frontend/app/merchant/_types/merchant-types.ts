export type MerchantTab =
  | 'dashboard'
  | 'calendar'
  | 'appointments'
  | 'disputes'
  | 'staff'
  | 'services'
  | 'billing'
  | 'settings'

export const MERCHANT_TAB_GROUPS = ['Salon Operations', 'Salon Configuration'] as const

export const MERCHANT_TAB_TITLES: Record<MerchantTab, string> = {
  dashboard: 'Dashboard',
  calendar: 'Calendar',
  appointments: 'Appointments',
  disputes: 'Dispute Counsel',
  staff: 'Staff',
  services: 'Services',
  billing: 'Billing',
  settings: 'Settings',
}

export const MERCHANT_TAB_SUBTITLES: Record<MerchantTab, string> = {
  dashboard: 'PayPal authorization holds, settlements, and KPIs.',
  calendar: 'Shift schedule and appointment timeline.',
  appointments: 'Bookings and cryptographic audit ledger.',
  disputes: 'PayPal Disputes v1 closed-loop AI defense and audit exhibits.',
  staff: 'Stylist roster and chair availability.',
  services: 'Service menu, pricing, and deposit rules.',
  billing: 'Platform commission accruals and SaaS invoices.',
  settings: 'PayPal merchant wallet and policy rules.',
}

export const MERCHANT_TAB_ROUTES: Record<MerchantTab, string> = {
  dashboard: '/merchant',
  calendar: '/merchant/calendar',
  appointments: '/merchant/appointments',
  disputes: '/merchant/disputes',
  staff: '/merchant/staff',
  services: '/merchant/services',
  billing: '/merchant/billing',
  settings: '/merchant/settings',
}

export function getMerchantTabFromPathname(pathname: string): MerchantTab {
  if (pathname.startsWith('/merchant/calendar')) return 'calendar'
  if (pathname.startsWith('/merchant/appointments')) return 'appointments'
  if (pathname.startsWith('/merchant/disputes')) return 'disputes'
  if (pathname.startsWith('/merchant/staff')) return 'staff'
  if (pathname.startsWith('/merchant/services')) return 'services'
  if (pathname.startsWith('/merchant/billing')) return 'billing'
  if (pathname.startsWith('/merchant/settings')) return 'settings'
  return 'dashboard'
}
