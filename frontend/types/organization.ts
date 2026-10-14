export type OrganizationStatus = "APPROVED" | "PENDING_REVIEW" | "SUSPENDED";

export interface Organization {
  id: string;
  name: string;
  category: string;
  ownerName: string;
  email: string;
  phone?: string;
  address: string;
  city?: string;
  status: OrganizationStatus;
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

export type ChangeRequestType = "PAYPAL_ACCOUNT" | "CANCELLATION_POLICY";

export type ChangeRequestStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export interface ChangeRequestPayload {
  paypalMerchantId?: string;
  policyHours?: number;
  noShowFee?: number;
  holdPercent?: number;
}

export interface ChangeRequest {
  id: string;
  type: ChangeRequestType;
  salonId: string;
  salonName: string;
  submittedAt: string;
  status: ChangeRequestStatus;
  rejectionReason?: string;
  currentData: ChangeRequestPayload;
  proposedData: ChangeRequestPayload;
}
