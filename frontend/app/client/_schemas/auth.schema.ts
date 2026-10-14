import { z } from 'zod'

import { optionalAuthPhoneSchema } from '@/lib/schema/auth'
import { fieldValidators } from '@/lib/schema/common'

export const clientSignUpSchema = z.object({
  first_name: fieldValidators.firstName(true),
  last_name: fieldValidators.lastName(true),
  email: fieldValidators.email(true),
  password: fieldValidators.password(8, true, false),
  phone: optionalAuthPhoneSchema,
})

export type ClientSignUpFormData = z.infer<typeof clientSignUpSchema>

export const clientSignUpDefaultValues: ClientSignUpFormData = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
}
