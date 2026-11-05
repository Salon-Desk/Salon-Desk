import { z } from 'zod'

import { fieldValidators } from '@/lib/schema/common'

export const categorySchema = z.object({
  name: fieldValidators.string(true, 'Category name is required'),
  description: z.string().trim().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export type CategoryFormData = z.infer<typeof categorySchema>

export const categoryDefaultValues: CategoryFormData = {
  name: '',
  description: '',
  status: 'ACTIVE',
}
