import { z } from 'zod'

import { fieldValidators } from '@/lib/schema/common'

export const paypalChangeSchema = z.object({
  merchant_id: fieldValidators.string(true, 'PayPal merchant ID is required'),
})

export type PaypalChangeFormData = z.infer<typeof paypalChangeSchema>

export const paypalChangeDefaultValues: PaypalChangeFormData = {
  merchant_id: '',
}

export const policyChangeSchema = z.object({
  policyHours: z.enum(['12', '24', '48', '72']),
  noShowFee: z.coerce.number().min(10),
})

export type PolicyChangeFormData = z.infer<typeof policyChangeSchema>

export const policyChangeDefaultValues: PolicyChangeFormData = {
  policyHours: '24',
  noShowFee: 30,
}
