/** Portal routes, referenced by the hub cards, sidebars and portal switcher. */
export const ROUTES = {
  hub: '/',
  client: '/client',
  clientExplore: '/client/explore',
  clientBookings: '/client/bookings',
  clientBook: '/client/book',
  clientProfile: '/client/profile',
  merchant: '/merchant',
  merchantDashboard: '/merchant',
  merchantCalendar: '/merchant/calendar',
  merchantAppointments: '/merchant/appointments',
  merchantStaff: '/merchant/staff',
  merchantServices: '/merchant/services',
  merchantSettings: '/merchant/settings',
  merchantSettingsHours: '/merchant/settings?tab=hours-location',
  merchantSettingsPaypal: '/merchant/settings/paypal',
  merchantSettingsPolicies: '/merchant/settings/policies',
  merchantSettingsBilling: '/merchant/billing',
  merchantBilling: '/merchant/billing',
  adminBilling: '/admin/billing',
  merchantOnboarding: '/merchant/onboarding',
  merchantProfile: '/merchant/profile',
  admin: '/admin',
  adminOverview: '/admin',
  adminSalons: '/admin/salons',
  adminRequests: '/admin/requests',
  adminCommission: '/admin/commission',
  adminTaxonomy: '/admin/taxonomy',
  adminStaff: '/admin/staff',
  adminReviews: '/admin/reviews',
  adminCuration: '/admin/curation',
  adminProfile: '/admin/profile',
  book: '/client/book',
  org: '/org',
} as const

export const FLAGSHIP_SALON = {
  id: 'org-1',
  name: 'Crown & Blade Atelier (SoHo Flagship)',
  shortName: 'Crown & Blade Atelier',
} as const

export type BuyerPersonaId = 'hana' | 'guest'

export const BUYER_PERSONAS: Record<
  BuyerPersonaId,
  {
    name: string
    email: string
    phone: string
    card: string
    shortLabel: string
  }
> = {
  hana: {
    name: 'Hana Sterling (Verified Sandbox Buyer)',
    email: 'hana.buyer@sandbox.salondesk.io',
    phone: '+1 (555) 789-0123',
    card: 'Visa •••• 4242',
    shortLabel: 'Hana (Sandbox)',
  },
  guest: {
    name: 'Guest Client (Unverified)',
    email: 'guest@example.com',
    phone: '+1 (555) 789-0123',
    card: 'Mastercard •••• 1099',
    shortLabel: 'Guest',
  },
}

export const SALONDESK_DEMO_PORTAL_PASSWORD = 'Password123!' as const

export type SandboxPayPalBuyerAccount = {
  email: string
  password: string
  label: string
}

export type SandboxPayPalMerchantAccount = {
  email: string
  password: string
  merchantId: string
  salonName: string
  portalOwnerEmail: string
}

export type SandboxPortalClientAccount = {
  email: string
  password: typeof SALONDESK_DEMO_PORTAL_PASSWORD
  label: string
  paypalCheckoutPassword: string
}

export type SandboxPortalSystemAccount = {
  email: string
  password: typeof SALONDESK_DEMO_PORTAL_PASSWORD
  label: string
  portal: string
}

export const SANDBOX_CREDENTIALS = {
  /** PayPal sandbox personal accounts — use at PayPal checkout / wallet login. */
  paypalBuyerAccounts: [
    {
      email: 'abebe07@personal.example.com',
      password: ',S7W{C-b',
      label: 'Personal sandbox buyer 1',
    },
    {
      email: 'ailurophile99@personal.example.com',
      password: 'RKd4)RGo',
      label: 'Personal sandbox buyer 2',
    },
  ] satisfies SandboxPayPalBuyerAccount[],
  /** PayPal sandbox business accounts — linked to the first two seeded salons. */
  paypalMerchantAccounts: [
    {
      email: 'merchent-two4113@business.example.com',
      password: 'G+!U0^6h',
      merchantId: 'VFP4W4G9ZGRHA',
      salonName: 'Abi Beauty Salon',
      portalOwnerEmail: 'owner@abibeautysalon.local',
    },
    {
      email: 'merchant330@business.example.com',
      password: '7AKMvL%>',
      merchantId: 'H2BNRFRFXM8BA',
      salonName: 'Lovely Beauty Spa',
      portalOwnerEmail: 'owner@lovelybeautyspa.local',
    },
  ] satisfies SandboxPayPalMerchantAccount[],
  /** SalonDesk app sign-in (same emails as buyers where noted). Portal password is shared. */
  portalClientAccounts: [
    {
      email: 'abebe07@personal.example.com',
      password: SALONDESK_DEMO_PORTAL_PASSWORD,
      label: 'Abebe Client',
      paypalCheckoutPassword: ',S7W{C-b',
    },
    {
      email: 'ailurophile99@personal.example.com',
      password: SALONDESK_DEMO_PORTAL_PASSWORD,
      label: 'Ailuro Client',
      paypalCheckoutPassword: 'RKd4)RGo',
    },
  ] satisfies SandboxPortalClientAccount[],
  /** SalonDesk platform admin/staff (seeded). */
  portalSystemAccounts: [
    {
      email: 'admin@salondesk.local',
      password: SALONDESK_DEMO_PORTAL_PASSWORD,
      label: 'Platform Admin',
      portal: 'Admin console',
    },
    {
      email: 'staff@salondesk.local',
      password: SALONDESK_DEMO_PORTAL_PASSWORD,
      label: 'Platform Staff',
      portal: 'Admin console',
    },
  ] satisfies SandboxPortalSystemAccount[],
  /** @deprecated Use paypalBuyerAccounts[0] — kept for toolbar quick copy. */
  buyerAccount: {
    email: 'abebe07@personal.example.com',
    password: ',S7W{C-b',
    name: 'Abebe Client (PayPal Sandbox)',
    card: 'PayPal Sandbox wallet',
  },
  /** @deprecated Use paypalMerchantAccounts[0] — kept for toolbar quick copy. */
  merchantAccount: {
    email: 'merchent-two4113@business.example.com',
    password: 'G+!U0^6h',
    salonName: 'Abi Beauty Salon',
    merchantId: 'VFP4W4G9ZGRHA',
  },
  techStack: {
    framework: 'Next.js 16 App Router',
    paypalApi: 'PayPal Orders & Payments v2 (REST)',
    paypalSdk: 'PayPal JS SDK v6 (@paypal/react-paypal-js)',
    agentToolkit: 'PayPal Agent Toolkit 1.11.0',
    aiEngine: 'Google Gemini 2.5 Flash',
  },
} as const

/** Sample request bodies surfaced in the sandbox modal for reviewers. */
export const SAMPLE_AUTHORIZATION_PAYLOAD = {
  intent: 'AUTHORIZE',
  purchase_units: [
    {
      reference_id: 'SD-8491',
      amount: { currency_code: 'USD', value: '25.00' },
      description: 'SalonDesk Authorization Hold: Precision Fade & Hot Towel Beard',
      payee: { merchant_id: SANDBOX_CREDENTIALS.paypalMerchantAccounts[0].merchantId },
    },
  ],
  application_context: {
    brand_name: 'SalonDesk Deposits',
    user_action: 'CONTINUE',
    shipping_preference: 'NO_SHIPPING',
  },
} as const

export const SAMPLE_NO_SHOW_CAPTURE_PAYLOAD = {
  amount: { currency_code: 'USD', value: '20.00' },
  final_capture: true,
  note_to_payer: 'No-show fee retained as per 24h salon policy. Excess hold released.',
} as const

export const FREE_CANCELLATION_HOURS = 24
