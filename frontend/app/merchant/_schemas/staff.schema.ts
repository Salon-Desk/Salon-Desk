import { z } from 'zod'

import { optionalAuthPhoneSchema } from '@/lib/schema/auth'
import { fieldValidators } from '@/lib/schema/common'

export const employeeRoleSchema = z.enum(['reception', 'stylist'])

export const createEmployeeSchema = z.object({
  email: fieldValidators.email(true),
  password: fieldValidators.password(8, true, false),
  first_name: fieldValidators.string(true, 'First name is required'),
  last_name: fieldValidators.string(true, 'Last name is required'),
  middle_name: z.string().trim().optional().nullable(),
  phone: optionalAuthPhoneSchema,
  role: employeeRoleSchema,
})

export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>

export const createEmployeeDefaultValues: CreateEmployeeFormData = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  middle_name: '',
  phone: '',
  role: 'stylist',
}

export const editEmployeeSchema = z.object({
  first_name: fieldValidators.string(true, 'First name is required'),
  last_name: fieldValidators.string(true, 'Last name is required'),
  middle_name: z.string().trim().optional().nullable(),
  phone: optionalAuthPhoneSchema,
  role: employeeRoleSchema,
  picture: z.string().trim().optional().nullable(),
})

export type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>
