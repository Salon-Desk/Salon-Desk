import type { SalonService, StaffMember } from '@/types'

export const INITIAL_SERVICES: SalonService[] = [
  {
    id: 'srv-1',
    name: 'Precision Fade & Hot Towel Beard',
    category: 'Haircuts',
    durationMin: 50,
    price: 65,
    holdDeposit: 25,
    noShowFee: 20,
    description:
      'Custom taper/skin fade with straight razor lineup, beard sculpting, and essential oil hot towel treatment.',
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
    description:
      'Hand-painted sun-kissed lightening, bond-builder protection, toner gloss, and blowout finish.',
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
    description:
      'Clarifying wash, amino acid steaming treatment, trim, and mirror-shine thermal silk wrap.',
  },
  {
    id: 'srv-4',
    name: 'Artisan Braids / Crown Cornrows',
    category: 'Braids & Locs',
    durationMin: 150,
    price: 140,
    holdDeposit: 45,
    noShowFee: 35,
    description:
      'Neat stitch braids or intricate scalp cornrows with edge finishing and soothing scalp oil.',
  },
  {
    id: 'srv-5',
    name: 'Detoxifying Hydro-Facial & Beard Revival',
    category: 'Spa & Facial',
    durationMin: 60,
    price: 95,
    holdDeposit: 30,
    noShowFee: 25,
    description:
      'Ultrasonic pore cleansing, vitamin C serum infusion, high-frequency beard comb, and cooling mask.',
  },
]

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
]

export const SERVICE_CATEGORIES = [
  'All',
  'Haircuts',
  'Styling & Color',
  'Braids & Locs',
  'Spa & Facial',
] as const

/**
 * Picks the stylist whose speciality matches a service category. Used by the
 * catalog cards and the quick-book flow so both land on the same stylist.
 */
export function stylistForCategory(category: SalonService['category']): StaffMember {
  if (category === 'Styling & Color') return INITIAL_STAFF[1]
  if (category === 'Braids & Locs') return INITIAL_STAFF[2]
  return INITIAL_STAFF[0]
}
