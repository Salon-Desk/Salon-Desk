import type { PlatformRole } from '@/types'

export const ADMIN_DEMO_EMAIL = 'admin@salondesk.local'
export const ADMIN_DEMO_PASSWORD = 'Password123!'

export const EMPTY_SALON_FORM = {
  name: '',
  category: 'Luxury Barber & Grooming Lounge',
  ownerName: '',
  email: '',
  phone: '',
  address: '',
  city: 'New York, NY',
  paypalMerchantId: '',
}

export const EMPTY_CATEGORY_FORM = {
  name: '',
  slug: '',
  description: '',
  iconName: 'Scissors',
  displayOrder: '1',
}

export const EMPTY_STAFF_FORM: {
  name: string
  email: string
  role: PlatformRole
} = {
  name: '',
  email: '',
  role: 'Support Agent',
}
