import { z } from 'zod'

import { fieldValidators, refineInternationalPhone } from '@/lib/schema/common'

export const signInSchema = z.object({
  email: fieldValidators.email(true),
  password: fieldValidators.password(8, true, false),
})

export type SignInFormData = z.infer<typeof signInSchema>

export const signInDefaultValues: SignInFormData = {
  email: '',
  password: '',
}

export const forgotPasswordSchema = z.object({
  email: fieldValidators.email(true),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export const forgotPasswordDefaultValues: ForgotPasswordFormData = {
  email: '',
}

export const resetPasswordSchema = z.object({
  token: fieldValidators.string(true, 'Reset token is required'),
  new_password: fieldValidators.password(8, true, false),
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export const resetPasswordDefaultValues: ResetPasswordFormData = {
  token: '',
  new_password: '',
}

/** Optional phone stored as intl-tel-input digit string. */
export const optionalAuthPhoneSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .superRefine((value, ctx) => {
    refineInternationalPhone(value, ctx, [], false)
  })
