import { z } from 'zod'

import { DEFAULT_WORKING_HOURS } from '@/constant/working-hours'
import { fieldValidators } from '@/lib/schema/common'

export const paypalChangeSchema = z.object({
  merchant_id: fieldValidators.string(true, 'PayPal merchant ID is required'),
  merchant_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  display_name: z.string().optional(),
})

export type PaypalChangeFormData = z.infer<typeof paypalChangeSchema>

export const paypalChangeDefaultValues: PaypalChangeFormData = {
  merchant_id: '',
  merchant_email: '',
  display_name: '',
}

export const policyChangeSchema = z.object({
  name: z
    .string()
    .min(3, 'Policy name must be at least 3 characters')
    .default('Standard 24h Policy'),
  policyHours: z.enum(['12', '24', '48', '72']),
  noShowFeePercent: z.coerce.number().min(0).max(100).default(50),
  lateCancelFeePercent: z.coerce.number().min(0).max(100).default(25),
  holdPercent: z.coerce.number().min(0).max(100).default(100),
})

export type PolicyChangeFormData = z.infer<typeof policyChangeSchema>

export const policyChangeDefaultValues: PolicyChangeFormData = {
  name: 'Standard 24h Policy',
  policyHours: '24',
  noShowFeePercent: 50,
  lateCancelFeePercent: 25,
  holdPercent: 100,
}

export const salonBrandingSchema = z.object({
  name: z.string().min(2, 'Salon name must be at least 2 characters'),
  description: z.string().optional().default(''),
  logo: z.unknown().optional(),
})

export type SalonBrandingFormData = z.infer<typeof salonBrandingSchema>

export const salonBrandingDefaultValues: SalonBrandingFormData = {
  name: '',
  description: '',
  logo: null,
}

export const salonLocationHoursSchema = z.object({
  physical_address: z.string().min(3, 'Physical address must be at least 3 characters'),
  timezone: z.string().min(1, 'Please select a timezone'),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  working_hours: z.custom<Record<string, [string, string][]>>(
    (val) => typeof val === 'object' && val !== null,
    { message: 'Valid working hours schedule is required' },
  ),
})

export type SalonLocationHoursFormData = z.infer<typeof salonLocationHoursSchema>

export const salonLocationHoursDefaultValues: SalonLocationHoursFormData = {
  physical_address: '',
  timezone: 'America/New_York',
  lat: null,
  lng: null,
  working_hours: DEFAULT_WORKING_HOURS,
}

export const orgSettingsSchema = z.object({
  name: z.string().min(2, 'Salon name must be at least 2 characters'),
  description: z.string().optional().default(''),
  physical_address: z.string().min(3, 'Physical address must be at least 3 characters'),
  timezone: z.string().min(1, 'Please select a timezone'),
  logo: z.unknown().optional(),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  working_hours: z.custom<Record<string, [string, string][]>>(
    (val) => typeof val === 'object' && val !== null,
    { message: 'Valid working hours schedule is required' },
  ),
})

export type OrgSettingsFormData = z.infer<typeof orgSettingsSchema>

export const orgSettingsDefaultValues: OrgSettingsFormData = {
  name: '',
  description: '',
  physical_address: '',
  timezone: 'America/New_York',
  logo: null,
  lat: null,
  lng: null,
  working_hours: DEFAULT_WORKING_HOURS,
}
