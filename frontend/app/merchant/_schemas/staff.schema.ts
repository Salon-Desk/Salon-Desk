import { z } from 'zod'

import { optionalAuthPhoneSchema } from '@/lib/schema/auth'
import { fieldValidators } from '@/lib/schema/common'

export const employeeRoleSchema = z.enum(['reception', 'stylist'])

export const createEmployeeSchema = z.object({
  email: fieldValidators.email(true),
  first_name: fieldValidators.string(true, 'First name is required'),
  last_name: fieldValidators.string(true, 'Last name is required'),
  handle: z
    .string()
    .trim()
    .max(50, 'Handle must be 50 characters or fewer')
    .regex(/^@?[a-zA-Z0-9_.-]*$/, 'Handle may only contain letters, numbers, underscores, and dots')
    .optional()
    .or(z.literal('')),
  middle_name: z.string().trim().optional().nullable(),
  phone: optionalAuthPhoneSchema,
  role: employeeRoleSchema,
  picture: z.any().optional(),
  category_ids: z.array(z.string()).optional(),
})

export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>

export const createEmployeeDefaultValues: CreateEmployeeFormData = {
  email: '',
  first_name: '',
  last_name: '',
  handle: '',
  middle_name: '',
  phone: '',
  role: 'stylist',
  category_ids: [],
}

export const editEmployeeSchema = z.object({
  first_name: fieldValidators.string(true, 'First name is required'),
  last_name: fieldValidators.string(true, 'Last name is required'),
  handle: z
    .string()
    .trim()
    .max(50, 'Handle must be 50 characters or fewer')
    .regex(/^@?[a-zA-Z0-9_.-]*$/, 'Handle may only contain letters, numbers, underscores, and dots')
    .optional()
    .or(z.literal('')),
  middle_name: z.string().trim().optional().nullable(),
  phone: optionalAuthPhoneSchema,
  role: employeeRoleSchema,
  picture: z.any().optional(),
  category_ids: z.array(z.string()).optional(),
})

export type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>
