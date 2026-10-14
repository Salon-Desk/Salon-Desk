export type HoldState = 'HELD' | 'CAPTURED' | 'VOIDED' | 'NO_SHOW_CAPTURED' | 'REAUTHORIZED';

export interface SalonService {
  id: string;
  name: string;
  category: 'Haircuts' | 'Styling & Color' | 'Braids & Locs' | 'Beard & Grooming' | 'Spa & Facial';
  durationMin: number;
  price: number;
  holdDeposit: number;
  noShowFee: number;
  description: string;
  popular?: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  specialties: string[];
  workingHours?: string;
  breakPeriod?: string;
  maxSimultaneousClients?: number;
  status?: 'ACTIVE' | 'ON_LEAVE';
}

export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  salonId: string;
  salonName: string;
  serviceId: string;
  serviceName: string;
  stylistId: string;
  stylistName: string;
  appointmentTime: string;
  durationMin: number;
  servicePrice: number;
  holdAmount: number;
  noShowFee: number;
  status: HoldState;
  paypalAuthId: string;
  authExpiresAt: string;
  idempotencyKey: string;
  consentHash: string;
  createdAt: string;
  settledAt?: string;
  settlementNote?: string;
  honorPeriodEndsInHours?: number;
  reauthorizedAt?: string;
}

export interface AuditLedgerEntry {
  id: string;
  bookingId: string;
  clientName: string;
  serviceName: string;
  action:
    | 'AUTHORIZATION_CREATED'
    | 'FULL_PAYMENT_CAPTURED'
    | 'NO_SHOW_FEE_CAPTURED'
    | 'AUTHORIZATION_VOIDED'
    | 'GOODWILL_PARTIAL_REFUND'
    | 'HONOR_PERIOD_REAUTHORIZED';
  amount: number;
  currency: string;
  paypalDebugId: string;
  webhookVerified: boolean;
  timestamp: string;
  details: string;
}

export interface Organization {
  id: string;
  name: string;
  category: string;
  ownerName: string;
  email: string;
  phone?: string;
  address: string;
  city?: string;
  status: 'APPROVED' | 'PENDING_REVIEW' | 'SUSPENDED';
  paypalMerchantId: string;
  verified: boolean;
  cancellationPolicyHours: number;
  activeHoldsCount: number;
  totalVolume: number;
  stylistsCount: number;
  customCommissionRate?: number;
  suspensionReason?: string;
  joinedAt?: string;
}

export interface ChangeRequest {
  id: string;
  type: 'PAYPAL_ACCOUNT' | 'CANCELLATION_POLICY';
  salonId: string;
  salonName: string;
  submittedAt: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  currentData: {
    paypalMerchantId?: string;
    policyHours?: number;
    noShowFee?: number;
    holdPercent?: number;
  };
  proposedData: {
    paypalMerchantId?: string;
    policyHours?: number;
    noShowFee?: number;
    holdPercent?: number;
  };
}

export interface CommissionOverride {
  salonId: string;
  salonName: string;
  customRate: number;
  note: string;
  updatedAt: string;
}

export interface CommissionTransaction {
  id: string;
  salonName: string;
  bookingAmount: number;
  capturedFee: number;
  platformCut: number;
  netPayout: number;
  paypalRef: string;
  timestamp: string;
}

export interface TaxonomyCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  displayOrder: number;
  status: 'ACTIVE' | 'HIDDEN';
  servicesCount: number;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Compliance Officer' | 'Support Agent';
  status: 'ACTIVE' | 'REVOKED';
  avatar: string;
  lastActive: string;
}
