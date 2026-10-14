import { z } from 'zod'

import { optionalAuthPhoneSchema } from '@/lib/schema/auth'
import { fieldValidators } from '@/lib/schema/common'

export const merchantSignUpSchema = z.object({
  first_name: fieldValidators.firstName(true),
  last_name: fieldValidators.lastName(true),
  email: fieldValidators.email(true),
  password: fieldValidators.password(8, true, false),
  phone: optionalAuthPhoneSchema,
  organization_name: fieldValidators.string(true, 'Salon name is required'),
  physical_address: fieldValidators.string(true, 'Physical address is required'),
  organization_description: fieldValidators.string(false),
})

export type MerchantSignUpFormData = z.infer<typeof merchantSignUpSchema>

export const merchantSignUpDefaultValues: MerchantSignUpFormData = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
  organization_name: '',
  physical_address: '',
  organization_description: '',
}
