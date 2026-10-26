'use client'

import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { PrimaryButton } from '@/components/button'
import FormProvider from '@/components/forms/FormProvider'
import RHFEmailField from '@/components/forms/RHFEmailField'
import RHFPasswordField from '@/components/forms/RHFPasswordField'
import RHFTextField from '@/components/forms/RHFTextField'
import useFormSubmitHandler from '@/hooks/formHandler'
import {
  forgotPasswordDefaultValues,
  type ForgotPasswordFormData,
  forgotPasswordSchema,
  resetPasswordDefaultValues,
  type ResetPasswordFormData,
  resetPasswordSchema,
} from '@/lib/schema/auth'
import { zodResolver } from '@/lib/schema/resolver'
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/store/api/sharedApi'
import type { ApiResponse } from '@/types/api'
import type { ForgotPasswordResponse, MessageOut } from '@/types/auth'

interface ForgotPasswordFormProps {
  onBackToSignIn: () => void
  initialResetToken?: string
}

export const ForgotPasswordForm: FC<ForgotPasswordFormProps> = ({
  onBackToSignIn,
  initialResetToken,
}) => {
  const [isResetStep, setIsResetStep] = useState(Boolean(initialResetToken))
  const [forgotPassword, { isLoading: isSubmittingForgot }] = useForgotPasswordMutation()
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation()

  const forgotMethods = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: forgotPasswordDefaultValues,
    mode: 'onBlur',
  })

  const resetMethods = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      ...resetPasswordDefaultValues,
      token: initialResetToken ?? resetPasswordDefaultValues.token,
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (initialResetToken) {
      resetMethods.setValue('token', initialResetToken)
      setIsResetStep(true)
    }
  }, [initialResetToken, resetMethods])

  const onForgotSuccess = (response: ApiResponse<ForgotPasswordResponse>) => {
    const token = response.data?.reset_token
    if (token) {
      resetMethods.setValue('token', token)
      setIsResetStep(true)
    }
  }

  const forgotSubmit = useFormSubmitHandler<ForgotPasswordFormData, ForgotPasswordResponse>(
    (body: ForgotPasswordFormData) =>
      forgotPassword({ email: body.email ?? '' })
        .unwrap()
        .then((data) => ({ data })),
    onForgotSuccess,
    'Password reset link sent to your email.',
  )

  const onResetSuccess = () => {
    setIsResetStep(false)
    resetMethods.reset(resetPasswordDefaultValues)
    onBackToSignIn()
  }

  const resetSubmit = useFormSubmitHandler<ResetPasswordFormData, MessageOut>(
    (body: ResetPasswordFormData) =>
      resetPassword({
        token: body.token ?? '',
        new_password: body.new_password ?? '',
      })
        .unwrap()
        .then((data) => ({ data })),
    onResetSuccess,
    'Password updated successfully. Please sign in.',
  )

  if (!isResetStep) {
    return (
      <FormProvider
        methods={forgotMethods}
        onSubmit={(e) => {
          e?.preventDefault()
          void forgotMethods.handleSubmit((data) =>
            forgotSubmit({ email: (data.email ?? '').trim() }),
          )(e)
        }}
      >
        <div className="space-y-4">
          <RHFEmailField
            name="email"
            label="Your Registered Email"
            placeholder="client@example.com"
            isRequired
          />
          <PrimaryButton
            title={isSubmittingForgot ? 'Sending...' : 'Send Password Reset Link'}
            isLoading={isSubmittingForgot}
            type="submit"
            size="sm"
            fullWidth="full"
            className="h-11 rounded-xl font-semibold shadow-none"
          />
          <div className="text-center">
            <button
              type="button"
              onClick={onBackToSignIn}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </FormProvider>
    )
  }

  return (
    <FormProvider
      methods={resetMethods}
      onSubmit={(e) => {
        e?.preventDefault()
        void resetMethods.handleSubmit((data) =>
          resetSubmit({
            token: (data.token ?? '').trim(),
            new_password: data.new_password ?? '',
          }),
        )(e)
      }}
    >
      <div className="space-y-4">
        <RHFTextField name="token" label="Reset Token" placeholder="Paste reset token" isRequired />
        <RHFPasswordField
          name="new_password"
          label="New Password (min 8 chars)"
          placeholder="••••••••"
          isRequired
        />
        <PrimaryButton
          title={isResetting ? 'Updating...' : 'Update Password'}
          isLoading={isResetting}
          type="submit"
          size="sm"
          fullWidth="full"
          className="h-11 rounded-xl font-semibold shadow-none"
        />
      </div>
    </FormProvider>
  )
}
