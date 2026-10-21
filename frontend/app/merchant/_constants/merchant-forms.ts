import type { SalonService } from '@/types'

export interface ServiceFormState {
  name: string
  category: SalonService['category']
  durationMin: number
  price: number
  holdDeposit: number
  noShowFee: number
  description: string
}

export const DEFAULT_SERVICE_FORM: ServiceFormState = {
  name: '',
  category: 'Braids & Locs',
  durationMin: 120,
  price: 120,
  holdDeposit: 120,
  noShowFee: 30,
  description: '',
}

export interface StaffFormState {
  name: string
  role: string
  workingHours?: string
  breakPeriod?: string
  specialties: string
  maxSimultaneousClients?: number
  status?: 'ACTIVE' | 'ON_LEAVE'
}

export const DEFAULT_STAFF_FORM: StaffFormState = {
  name: '',
  role: 'Lead Stylist',
  workingHours: '9:00 AM - 6:00 PM',
  breakPeriod: '1:00 PM - 2:00 PM',
  specialties: 'Knotless Braids, Silk Press',
  maxSimultaneousClients: 1,
  status: 'ACTIVE',
}
