/** Editorial content that dresses up the client-facing service catalog. */

export const SERVICE_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80'

export const SERVICE_IMAGES: Record<string, string> = {
  'srv-1':
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
  'srv-2':
    'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80',
  'srv-3':
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
  'srv-4':
    'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&auto=format&fit=crop&q=80',
  'srv-5':
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
}

export function serviceImage(serviceId: string): string {
  return SERVICE_IMAGES[serviceId] ?? SERVICE_IMAGE_FALLBACK
}

export interface ServiceProtocol {
  steps: string[]
  products: string
  idealFor: string
}

export const SERVICE_PROTOCOLS: Record<string, ServiceProtocol> = {
  'srv-1': {
    steps: [
      '1. Custom Consultation & Facial Geometry Mapping (5 mins)',
      '2. Precision Scissor & Clipper Skin/Taper Fade Sculpting (25 mins)',
      '3. Essential Oil Organic Eucalyptus Hot Towel Treatment (10 mins)',
      '4. Straight-Razor Lineup & Sandalwood Beard Hydration (10 mins)',
    ],
    products: 'Organic Tea Tree Cleanser, Moroccan Argan Beard Elixir, Eucalyptus Steamed Compress',
    idealFor: 'Gentlemen seeking a sharp, pristine executive taper with restorative skin care.',
  },
  'srv-2': {
    steps: [
      '1. Shade & Dimension Consultation with Color Swatches (15 mins)',
      '2. Hand-Painted Artisan French Balayage & Foil Separation (50 mins)',
      '3. Olaplex Bond-Building Regenerative Wash (25 mins)',
      '4. Custom High-Gloss Glaze Toner & Editorial Round-Brush Blowout (30 mins)',
    ],
    products: 'L’Oréal Professionnel Blond Studio, Olaplex No. 1 & 2, Kerastase Nutritive Gloss',
    idealFor:
      'Natural multidimensional lightness, seamlessly blended grow-out, and supreme hair health.',
  },
  'srv-3': {
    steps: [
      '1. Detoxifying Scalp Clarification & Residue Removal (15 mins)',
      '2. Nano-Steam Hydro Moisture Deep Conditioning Mask (25 mins)',
      '3. Precision Split-End Dusting & Thermal Heat Shielding (20 mins)',
      '4. Ceramic Silk Wrap Smoothing & Glass-Sheen Feather Finish (30 mins)',
    ],
    products: 'Amino-Acid Moisture Infusion, Jamaican Black Castor Oil, Thermal Silk Serum',
    idealFor:
      'Textured and natural hair seeking maximum softness, featherweight movement, and zero damage.',
  },
  'srv-4': {
    steps: [
      '1. Scalp Cleansing & Botanical Tea Tree Conditioning (20 mins)',
      '2. Scalp Sectioning & Precision Stitch Cornrow Parting (30 mins)',
      '3. Artisan Braid Weaving with Knotless Tension Relief (80 mins)',
      '4. Soothing Peppermint Edge Sculpting & Mousse Set (20 mins)',
    ],
    products: 'Organic Rosemary Mint Oil, Edge Control Wax, Flaxseed Sculpting Jelly',
    idealFor:
      'Protective crown styling with exquisite symmetry, longevity, and comfortable scalp tension.',
  },
  'srv-5': {
    steps: [
      '1. Ultrasonic Hydro-Dermabrasion & Deep Pore Extraction (20 mins)',
      '2. Vitamin C & Hyaluronic Peptide Jet Infusion (15 mins)',
      '3. High-Frequency Anti-Microbial Beard Root Therapy (15 mins)',
      '4. Cryo-Cooling Collagen Sheet Mask & Neck Massage (10 mins)',
    ],
    products: 'Pure Hyaluronic Acid, Marine Collagen Peptides, Cold-Pressed Jojoba',
    idealFor:
      'Decongesting urban skin, smoothing rough beard follicles, and instant radiant complexion.',
  },
}

export interface TimeSlot {
  label: string
  period: 'Morning' | 'Afternoon' | 'Evening'
  day: string
}

export const TIME_SLOTS: TimeSlot[] = [
  { label: '10:00 AM', period: 'Morning', day: 'Tomorrow' },
  { label: '11:30 AM', period: 'Morning', day: 'Tomorrow' },
  { label: '2:00 PM', period: 'Afternoon', day: 'Tomorrow' },
  { label: '3:30 PM', period: 'Afternoon', day: 'Tomorrow' },
  { label: '5:00 PM', period: 'Evening', day: 'Tomorrow' },
  { label: '6:30 PM', period: 'Evening', day: 'Tomorrow' },
  { label: '11:00 AM', period: 'Morning', day: 'Saturday' },
  { label: '2:30 PM', period: 'Afternoon', day: 'Saturday' },
]

export const DEFAULT_TIME_SLOT = 'Tomorrow · 2:00 PM'

export function formatSlot(slot: TimeSlot): string {
  return `${slot.day} · ${slot.label}`
}
