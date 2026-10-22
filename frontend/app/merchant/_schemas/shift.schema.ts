import { z } from 'zod'

export const createShiftSchema = z
  .object({
    name: z.string().min(2, 'Shift name must be at least 2 characters'),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid start time (HH:MM)'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid end time (HH:MM)'),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Shift start time must be before end time',
    path: ['endTime'],
  })

export type CreateShiftFormData = z.infer<typeof createShiftSchema>

export const createShiftDefaultValues: CreateShiftFormData = {
  name: '',
  startTime: '09:00',
  endTime: '17:00',
}
