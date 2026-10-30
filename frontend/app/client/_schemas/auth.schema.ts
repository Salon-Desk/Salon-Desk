import { z } from 'zod'

import { fieldValidators, internationalPhoneField } from '@/lib/schema/common'

export const clientSignUpSchema = z
  .object({
    first_name: fieldValidators.firstName(true),
    last_name: fieldValidators.lastName(true),
    email: fieldValidators.email(true),
    phone: internationalPhoneField(true),
    password: fieldValidators.password(8, true, false),
    confirm_password: fieldValidators.password(8, true, false),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export type ClientSignUpFormData = z.infer<typeof clientSignUpSchema>

export const clientSignUpDefaultValues: ClientSignUpFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  confirm_password: '',
}
