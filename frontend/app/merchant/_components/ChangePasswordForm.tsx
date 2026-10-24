'use client'

import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import FormProvider from '@/components/forms/FormProvider'
import RHFTextField from '@/components/forms/RHFTextField'
import { Card } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useChangePasswordMutation } from '@/store/api/sharedApi'

interface ChangePasswordForm {
  current_password: string
  new_password: string
  confirm_password: string
}

export function ChangePasswordForm() {
  const [changePassword, { isLoading }] = useChangePasswordMutation()
  const methods = useForm<ChangePasswordForm>({
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  const onSubmit = async (data: ChangePasswordForm) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('New passwords do not match', toastColor.error)
      return
    }

    if (data.new_password.length < 8) {
      toast.error('Password must be at least 8 characters', toastColor.error)
      return
    }

    try {
      await changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      }).unwrap()
      toast.success('Password changed successfully', toastColor.success)
      methods.reset()
    } catch (err) {
      toast.error(
        String(
          (err as { data?: { detail?: string } })?.data?.detail || 'Failed to change password',
        ),
        toastColor.error,
      )
    }
  }

  return (
    <Card padding="lg" className="rounded-xl border border-slate-200/70 bg-white shadow-none">
      <h2 className="font-bold text-slate-900 text-sm">Change Password</h2>
      <p className="mt-1 text-xs text-slate-500">
        Update your account password. Make sure to use a strong password.
      </p>

      <FormProvider methods={methods} onSubmit={(e) => void methods.handleSubmit(onSubmit)(e)}>
        <div className="mt-5 space-y-4">
          <RHFTextField
            name="current_password"
            label="Current password"
            type="password"
            isRequired
          />
          <RHFTextField name="new_password" label="New password" type="password" isRequired />
          <RHFTextField
            name="confirm_password"
            label="Confirm new password"
            type="password"
            isRequired
          />

          <PrimaryButton
            title={isLoading ? 'Changing…' : 'Change password'}
            type="submit"
            isLoading={isLoading}
            className="h-10 w-full sm:w-auto"
          />
        </div>
      </FormProvider>
    </Card>
  )
}
