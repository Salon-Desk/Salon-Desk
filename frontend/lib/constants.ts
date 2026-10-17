/** Portal routes, referenced by the hub cards, sidebars and portal switcher. */
export const ROUTES = {
  hub: '/',
  client: '/client',
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
  merchantSettingsPaypal: '/merchant/settings/paypal',
  merchantSettingsPolicies: '/merchant/settings/policies',
  merchantOnboarding: '/merchant/onboarding',
  merchantProfile: '/merchant/profile',
  admin: '/admin',
  adminOverview: '/admin',
  adminSalons: '/admin/salons',
  adminRequests: '/admin/requests',
  adminCommission: '/admin/commission',
  adminTaxonomy: '/admin/taxonomy',
  adminStaff: '/admin/staff',
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

export const SANDBOX_CREDENTIALS = {
  buyerAccount: {
    email: 'client@example.com',
    password: 'Password123!',
    name: 'Ada Client (Demo Client)',
    card: '•••• 4242 (Visa Mock)',
  },
  merchantAccount: {
    email: 'owner@abibeautysalon.local',
    password: 'Password123!',
    salonName: 'Abi Beauty Salon',
    merchantId: 'DEMO-0001-ABIBEAUTYSALON',
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
      payee: { merchant_id: 'SELAM-MERCHANT-DEMO' },
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
