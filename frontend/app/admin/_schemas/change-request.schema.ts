import { z } from 'zod'

export const changeRequestReviewSchema = z.object({
  review_notes: z.string().trim().optional().nullable(),
})

export type ChangeRequestReviewFormData = z.infer<typeof changeRequestReviewSchema>

export const changeRequestReviewDefaultValues: ChangeRequestReviewFormData = {
  review_notes: '',
}
