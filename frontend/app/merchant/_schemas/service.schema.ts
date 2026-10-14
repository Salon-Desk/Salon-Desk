import { z } from 'zod'

import { fieldValidators } from '@/lib/schema/common'

export const orgServiceSchema = z.object({
  service_category_id: fieldValidators.string(true, 'Category is required'),
  name: fieldValidators.string(true, 'Service name is required'),
  description: z.string().trim().optional().nullable(),
  base_price: z.coerce.number().min(0, 'Price must be 0 or more'),
  duration_minutes: z.coerce.number().int().min(1, 'Duration must be at least 1 minute'),
  simultaneous_capacity: z.coerce.number().int().min(1).default(1),
  status: z.enum(['active', 'inactive']).optional(),
})

export type OrgServiceFormData = z.infer<typeof orgServiceSchema>

export const orgServiceDefaultValues: OrgServiceFormData = {
  service_category_id: '',
  name: '',
  description: '',
  base_price: 0,
  duration_minutes: 60,
  simultaneous_capacity: 1,
  status: 'active',
}
