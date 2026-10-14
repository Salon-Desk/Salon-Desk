import { z } from 'zod'

import { optionalAuthPhoneSchema } from '@/lib/schema/auth'
import { fieldValidators } from '@/lib/schema/common'

export const adminStaffSchema = z.object({
  email: fieldValidators.email(true),
  password: fieldValidators.password(8, true, false),
  first_name: fieldValidators.string(true, 'First name is required'),
  last_name: fieldValidators.string(true, 'Last name is required'),
  middle_name: z.string().trim().optional().nullable(),
  phone: optionalAuthPhoneSchema,
})

export type AdminStaffFormData = z.infer<typeof adminStaffSchema>

export const adminStaffDefaultValues: AdminStaffFormData = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  middle_name: '',
  phone: '',
}
