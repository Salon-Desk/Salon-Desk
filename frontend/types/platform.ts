export interface CommissionOverride {
  salonId: string
  salonName: string
  customRate: number
  note: string
  updatedAt: string
}

export interface CommissionTransaction {
  id: string
  salonName: string
  bookingAmount: number
  capturedFee: number
  platformCut: number
  netPayout: number
  paypalRef: string
  timestamp: string
}

export interface TaxonomyCategory {
  id: string
  name: string
  slug: string
  description: string
  iconName: string
  displayOrder: number
  status: 'ACTIVE' | 'HIDDEN'
  servicesCount: number
}

export type PlatformRole = 'Super Admin' | 'Compliance Officer' | 'Support Agent'

export interface PlatformUser {
  id: string
  name: string
  email: string
  role: PlatformRole
  status: 'ACTIVE' | 'REVOKED'
  avatar: string
  lastActive: string
}
