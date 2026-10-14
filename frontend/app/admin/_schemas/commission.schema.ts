import { z } from 'zod'

import { fieldValidators } from '@/lib/schema/common'

export const commissionSchema = z
  .object({
    service_category_id: fieldValidators.string(true, 'Category is required'),
    name: fieldValidators.string(true, 'Name is required'),
    type: z.enum(['percentage', 'flat', 'hybrid']),
    percentage: z.coerce.number().min(0).max(100).optional().nullable(),
    flat: z.coerce.number().min(0).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'percentage' || data.type === 'hybrid') {
      if (data.percentage == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Percentage is required',
          path: ['percentage'],
        })
      }
    }
    if (data.type === 'flat' || data.type === 'hybrid') {
      if (data.flat == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Flat fee is required',
          path: ['flat'],
        })
      }
    }
  })

export type CommissionFormData = z.infer<typeof commissionSchema>

export const commissionDefaultValues: CommissionFormData = {
  service_category_id: '',
  name: '',
  type: 'percentage',
  percentage: 2.5,
  flat: null,
}
