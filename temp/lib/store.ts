import { Booking, AuditLedgerEntry, SalonService, StaffMember, Organization } from '@/types';

export const INITIAL_SERVICES: SalonService[] = [
  {
    id: 'srv-1',
    name: 'Precision Fade & Hot Towel Beard',
    category: 'Haircuts',
    durationMin: 50,
    price: 65,
    holdDeposit: 25,
    noShowFee: 20,
    description: 'Custom taper/skin fade with straight razor lineup, beard sculpting, and essential oil hot towel treatment.',
    popular: true,
  },
  {
    id: 'srv-2',
    name: 'Signature Balayage & Gloss Finish',
    category: 'Styling & Color',
    durationMin: 120,
    price: 185,
    holdDeposit: 50,
    noShowFee: 40,
    description: 'Hand-painted sun-kissed lightening, bond-builder protection, toner gloss, and blowout finish.',
    popular: true,
  },
  {
    id: 'srv-3',
    name: 'Silk Press & Deep Moisture Infusion',
    category: 'Styling & Color',
    durationMin: 90,
    price: 110,
    holdDeposit: 35,
    noShowFee: 30,
    description: 'Clarifying wash, amino acid steaming treatment, trim, and mirror-shine thermal silk wrap.',
  },
  {
    id: 'srv-4',
    name: 'Artisan Braids / Crown Cornrows',
    category: 'Braids & Locs',
    durationMin: 150,
    price: 140,
    holdDeposit: 45,
    noShowFee: 35,
    description: 'Neat stitch braids or intricate scalp cornrows with edge finishing and soothing scalp oil.',
  },
  {
    id: 'srv-5',
    name: 'Detoxifying Hydro-Facial & Beard Revival',
    category: 'Spa & Facial',
    durationMin: 60,
    price: 95,
    holdDeposit: 30,
    noShowFee: 25,
    description: 'Ultrasonic pore cleansing, vitamin C serum infusion, high-frequency beard comb, and cooling mask.',
  },
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'stf-1',
    name: 'Marcus Vance',
    role: 'Master Barber & Texture Specialist',
    avatar: 'https://picsum.photos/seed/marcus/200/200',
    rating: 4.98,
    reviewsCount: 342,
    specialties: ['Skin Fades', 'Beard Art', 'Hot Towel Shave'],
  },
  {
    id: 'stf-2',
    name: 'Elena Rostova',
    role: 'Senior Colorist & Balayage Director',
    avatar: 'https://picsum.photos/seed/elena/200/200',
    rating: 4.95,
    reviewsCount: 289,
    specialties: ['Balayage', 'Color Correction', 'Glossing'],
  },
  {
    id: 'stf-3',
    name: 'Kai Chen',
    role: 'Editorial Stylist & Silk Press Pro',
    avatar: 'https://picsum.photos/seed/kaichen/200/200',
    rating: 4.92,
    reviewsCount: 215,
    specialties: ['Silk Press', 'Precision Bob', 'Thermal Styling'],
  },
];

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-1',
    name: 'Crown & Blade Atelier (SoHo Flagship)',
    category: 'Luxury Barber & Grooming Lounge',
    ownerName: 'Derrick Vance',
    email: 'derrick@crownandblade.com',
    address: '448 W Broadway, New York, NY 10012',
    status: 'APPROVED',
    paypalMerchantId: 'MERCHANT_CROWN_7781',
    verified: true,
    cancellationPolicyHours: 24,
    activeHoldsCount: 9,
    totalVolume: 42850,
    stylistsCount: 6,
  },
  {
    id: 'org-2',
    name: 'Velvet Mane Color Studio',
    category: 'Hair Salon & Color Lab',
    ownerName: 'Chloe Dupont',
    email: 'chloe@velvetmanestudio.com',
    address: '112 Mercer St, New York, NY 10012',
    status: 'APPROVED',
    paypalMerchantId: 'MERCHANT_VELVET_9921',
    verified: true,
    cancellationPolicyHours: 24,
    activeHoldsCount: 14,
    totalVolume: 68400,
    stylistsCount: 8,
  },
  {
    id: 'org-3',
    name: 'Luxe Aura Spa & Loc Lounge',
    category: 'Natural Hair & Holistic Spa',
    ownerName: 'Amara Diop',
    email: 'contact@luxeaura.com',
    address: '88 Franklin St, New York, NY 10013',
    status: 'PENDING_REVIEW',
    paypalMerchantId: 'MERCHANT_AURA_1042',
    verified: false,
    cancellationPolicyHours: 48,
    activeHoldsCount: 3,
    totalVolume: 11200,
    stylistsCount: 4,
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'SD-8491',
    clientName: 'Alexander Hayes',
    clientEmail: 'alex.hayes@example.com',
    clientPhone: '+1 (555) 234-8901',
    salonId: 'org-1',
    salonName: 'Crown & Blade Atelier',
    serviceId: 'srv-1',
    serviceName: 'Precision Fade & Hot Towel Beard',
    stylistId: 'stf-1',
    stylistName: 'Marcus Vance',
    appointmentTime: 'Today · 3:30 PM',
    durationMin: 50,
    servicePrice: 65,
    holdAmount: 25,
    noShowFee: 20,
    status: 'HELD',
    paypalAuthId: 'AUTH-9A82B17C4501',
    authExpiresAt: 'In 6 days, 22 hrs',
    idempotencyKey: 'IDEMP_8491_AUTH_SEC',
    consentHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    createdAt: 'Today, 10:15 AM',
  },
  {
    id: 'SD-8492',
    clientName: 'Sophia Montgomery',
    clientEmail: 'sophia.m@example.com',
    clientPhone: '+1 (555) 345-6789',
    salonId: 'org-1',
    salonName: 'Crown & Blade Atelier',
    serviceId: 'srv-2',
    serviceName: 'Signature Balayage & Gloss Finish',
    stylistId: 'stf-2',
    stylistName: 'Elena Rostova',
    appointmentTime: 'Today · 4:45 PM',
    durationMin: 120,
    servicePrice: 185,
    holdAmount: 50,
    noShowFee: 40,
    status: 'HELD',
    paypalAuthId: 'AUTH-3F19E82D6794',
    authExpiresAt: 'In 6 days, 20 hrs',
    idempotencyKey: 'IDEMP_8492_AUTH_SEC',
    consentHash: 'sha256:4d623253b827e7d0322c37e6fbe53434de540f34eef13a69772bf2ebad9b3c4f',
    createdAt: 'Today, 11:30 AM',
  },
  {
    id: 'SD-8488',
    clientName: 'Julian Rossi',
    clientEmail: 'julian.rossi@example.com',
    clientPhone: '+1 (555) 456-7890',
    salonId: 'org-1',
    salonName: 'Crown & Blade Atelier',
    serviceId: 'srv-1',
    serviceName: 'Precision Fade & Hot Towel Beard',
    stylistId: 'stf-1',
    stylistName: 'Marcus Vance',
    appointmentTime: 'Today · 1:00 PM',
    durationMin: 50,
    servicePrice: 65,
    holdAmount: 25,
    noShowFee: 20,
    status: 'CAPTURED',
    paypalAuthId: 'AUTH-1B90C45D8832',
    authExpiresAt: 'Captured (Settled)',
    idempotencyKey: 'IDEMP_8488_SETTLE_COMPL',
    consentHash: 'sha256:8b45f1b1c3e1a6c117b18ef01198642a8b94101e9206b0b23f2f84b3d7d890a2',
    createdAt: 'Today, 9:00 AM',
    settledAt: 'Today, 1:52 PM',
    settlementNote: 'Client showed up; $65 full service payment captured via PayPal Orders API.',
  },
  {
    id: 'SD-8485',
    clientName: 'Brandon Walsh',
    clientEmail: 'brandon.w@example.com',
    clientPhone: '+1 (555) 567-8901',
    salonId: 'org-1',
    salonName: 'Crown & Blade Atelier',
    serviceId: 'srv-1',
    serviceName: 'Precision Fade & Hot Towel Beard',
    stylistId: 'stf-1',
    stylistName: 'Marcus Vance',
    appointmentTime: 'Yesterday · 5:00 PM',
    durationMin: 50,
    servicePrice: 65,
    holdAmount: 25,
    noShowFee: 20,
    status: 'NO_SHOW_CAPTURED',
    paypalAuthId: 'AUTH-5D72A99E1023',
    authExpiresAt: 'Partial Captured ($20)',
    idempotencyKey: 'IDEMP_8485_NOSHOW_FINAL',
    consentHash: 'sha256:1a829f0e2b4c7d91e3f5a7c2b4d8e0a1c3e5a7b9d1f3b5d7e9a1c3e5f7a9b1c3',
    createdAt: 'Yesterday, 1:15 PM',
    settledAt: 'Yesterday, 5:35 PM',
    settlementNote: 'No-show confirmed after 30 min window; partial $20 fee captured, $5 excess released.',
  },
  {
    id: 'SD-8480',
    clientName: 'Maya Lin',
    clientEmail: 'maya.lin@example.com',
    clientPhone: '+1 (555) 678-9012',
    salonId: 'org-1',
    salonName: 'Crown & Blade Atelier',
    serviceId: 'srv-3',
    serviceName: 'Silk Press & Deep Moisture Infusion',
    stylistId: 'stf-3',
    stylistName: 'Kai Chen',
    appointmentTime: 'Tomorrow · 11:00 AM',
    durationMin: 90,
    servicePrice: 110,
    holdAmount: 35,
    noShowFee: 30,
    status: 'VOIDED',
    paypalAuthId: 'AUTH-8C21B66D4411',
    authExpiresAt: 'Authorization Voided',
    idempotencyKey: 'IDEMP_8480_CLIENT_CANCEL',
    consentHash: 'sha256:90e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3e5f7a9b1c3e5f7a9b1c3e5f7a9b1',
    createdAt: '2 days ago',
    settledAt: 'Today, 8:40 AM',
    settlementNote: 'Client self-service cancellation >24h in advance; authorization voided ($0 charged).',
  },
];

export const INITIAL_AUDIT_LEDGER: AuditLedgerEntry[] = [
  {
    id: 'LEDGER-904',
    bookingId: 'SD-8492',
    clientName: 'Sophia Montgomery',
    serviceName: 'Signature Balayage & Gloss Finish',
    action: 'AUTHORIZATION_CREATED',
    amount: 50,
    currency: 'USD',
    paypalDebugId: 'DEBUG_REQ_7B9A2F81',
    webhookVerified: true,
    timestamp: 'Today, 11:30:14 AM',
    details: 'PayPal SDK v6 Authorization hold created (intent: AUTHORIZE). Funds held, zero debited.',
  },
  {
    id: 'LEDGER-903',
    bookingId: 'SD-8491',
    clientName: 'Alexander Hayes',
    serviceName: 'Precision Fade & Hot Towel Beard',
    action: 'AUTHORIZATION_CREATED',
    amount: 25,
    currency: 'USD',
    paypalDebugId: 'DEBUG_REQ_4C18E9A2',
    webhookVerified: true,
    timestamp: 'Today, 10:15:22 AM',
    details: 'PayPal SDK v6 Authorization hold created (intent: AUTHORIZE). Funds reserved on buyer card.',
  },
  {
    id: 'LEDGER-902',
    bookingId: 'SD-8488',
    clientName: 'Julian Rossi',
    serviceName: 'Precision Fade & Hot Towel Beard',
    action: 'FULL_PAYMENT_CAPTURED',
    amount: 65,
    currency: 'USD',
    paypalDebugId: 'DEBUG_REQ_9D31A054',
    webhookVerified: true,
    timestamp: 'Today, 1:52:08 PM',
    details: 'Staff marked SHOW. PayPal Payments v2 capture authorization executed for $65 full ticket.',
  },
  {
    id: 'LEDGER-901',
    bookingId: 'SD-8485',
    clientName: 'Brandon Walsh',
    serviceName: 'Precision Fade & Hot Towel Beard',
    action: 'NO_SHOW_FEE_CAPTURED',
    amount: 20,
    currency: 'USD',
    paypalDebugId: 'DEBUG_REQ_2A77B139',
    webhookVerified: true,
    timestamp: 'Yesterday, 5:35:41 PM',
    details: 'Staff marked NO-SHOW. Partial capture of $20 executed with final_capture: true; remaining $5 released.',
  },
  {
    id: 'LEDGER-900',
    bookingId: 'SD-8480',
    clientName: 'Maya Lin',
    serviceName: 'Silk Press & Deep Moisture Infusion',
    action: 'AUTHORIZATION_VOIDED',
    amount: 35,
    currency: 'USD',
    paypalDebugId: 'DEBUG_REQ_1F88D701',
    webhookVerified: true,
    timestamp: 'Today, 8:40:19 AM',
    details: 'Client cancelled >24 hrs prior to appointment. PayPal authorization voided, hold immediately lifted.',
  },
];

export const SANDBOX_CREDENTIALS = {
  buyerAccount: {
    email: 'buyer-sandbox@salondesk.dev',
    password: 'SalonTester2026!',
    name: 'Jane Doe (Sandbox Client)',
    card: '•••• 4242 (Visa Mock)',
  },
  merchantAccount: {
    email: 'merchant-soho@salondesk.dev',
    password: 'MerchantAuthPass88!',
    salonName: 'Crown & Blade Atelier',
    merchantId: 'MERCHANT_CROWN_7781',
  },
  techStack: {
    framework: 'Next.js 15 App Router',
    paypalApi: 'PayPal Orders & Payments v2 (REST)',
    paypalSdk: 'PayPal JS SDK v6 (@paypal/react-paypal-js)',
    agentToolkit: 'PayPal Agent Toolkit 1.11.0',
    aiEngine: 'Google Gemini 2.5 Flash',
  },
};

// Client-side persistent store helper
const STORE_KEY = 'salondesk_deposits_state_v1';

export interface AppStoreData {
  bookings: Booking[];
  auditLedger: AuditLedgerEntry[];
  organizations: Organization[];
  lastResetAt: string;
}

export function getStoredState(): AppStoreData {
  if (typeof window === 'undefined') {
    return {
      bookings: INITIAL_BOOKINGS,
      auditLedger: INITIAL_AUDIT_LEDGER,
      organizations: INITIAL_ORGANIZATIONS,
      lastResetAt: new Date().toISOString(),
    };
  }

  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }

  const defaultState: AppStoreData = {
    bookings: INITIAL_BOOKINGS,
    auditLedger: INITIAL_AUDIT_LEDGER,
    organizations: INITIAL_ORGANIZATIONS,
    lastResetAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(defaultState));
  } catch {
    // ignore
  }

  return defaultState;
}

export function saveStoredState(state: AppStoreData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('salondesk_store_updated'));
  } catch {
    // ignore
  }
}

export function resetDemoState(): AppStoreData {
  const freshState: AppStoreData = {
    bookings: INITIAL_BOOKINGS,
    auditLedger: INITIAL_AUDIT_LEDGER,
    organizations: INITIAL_ORGANIZATIONS,
    lastResetAt: new Date().toISOString(),
  };
  saveStoredState(freshState);
  return freshState;
}
