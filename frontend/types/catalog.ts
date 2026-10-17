export type ServiceCategory =
  'Haircuts' | 'Styling & Color' | 'Braids & Locs' | 'Beard & Grooming' | 'Spa & Facial'

export interface SalonService {
  id: string
  name: string
  category: ServiceCategory
  durationMin: number
  price: number
  holdDeposit: number
  noShowFee: number
  description: string
  popular?: boolean
  imageUrl?: string
  organizationId?: string
  organizationName?: string
  distanceKm?: number
}

export type StaffStatus = 'ACTIVE' | 'ON_LEAVE'

export interface StaffMember {
  id: string
  name: string
  role: string
  avatar: string
  rating: number
  reviewsCount: number
  specialties: string[]
  workingHours?: string
  breakPeriod?: string
  maxSimultaneousClients?: number
  status?: StaffStatus
}
