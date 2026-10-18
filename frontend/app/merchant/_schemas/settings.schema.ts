import { z } from 'zod'

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
