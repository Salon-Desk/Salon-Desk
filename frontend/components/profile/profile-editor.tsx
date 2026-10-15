'use client'

import type { FC } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { z } from 'zod'

import PrimaryButton from '@/components/button/PrimaryButton'
import FormProvider from '@/components/forms/FormProvider'
import RHFTextField from '@/components/forms/RHFTextField'
import useFormSubmitHandler from '@/hooks/formHandler'
import { zodResolver } from '@/lib/schema/resolver'
import { userSelector } from '@/store/authSlice'
import { useGetProfileQuery, useUpdateProfileMutation } from '@/store/slice/authApi'
import type { ProfileUpdatePayload } from '@/types/user'

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  middle_name: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileEditorProps {
  title?: string
  description?: string
}

export const ProfileEditor: FC<ProfileEditorProps> = ({
  title = 'Profile',
  description = 'Update your contact details used across SalonDesk portals.',
}) => {
  const user = useSelector(userSelector)
  const { data: profile, isLoading } = useGetProfileQuery(undefined, { skip: !user })
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation()

  const methods = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      first_name: profile?.first_name || user?.first_name || '',
      last_name: profile?.last_name || user?.last_name || '',
      phone: profile?.phone || '',
      middle_name: profile?.middle_name || '',
    },
  })

  const submitHandler = useFormSubmitHandler<ProfileUpdatePayload, unknown>(
    (body: ProfileUpdatePayload) =>
      updateProfile(body)
        .unwrap()
        .then((data) => ({ data })),
    () => undefined,
    'Profile updated',
  )

  const onSubmit = async (data: ProfileFormData) => {
    await submitHandler(data)
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading profile…</p>
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
        {user?.email ? (
          <p className="mt-2 text-xs text-slate-500">Signed in as {user.email}</p>
        ) : null}
      </div>

      <FormProvider methods={methods} onSubmit={(e) => void methods.handleSubmit(onSubmit)(e)}>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <RHFTextField name="first_name" label="First name" isRequired />
          <RHFTextField name="middle_name" label="Middle name" />
          <RHFTextField name="last_name" label="Last name" isRequired />
          <RHFTextField name="phone" label="Phone" />
          <PrimaryButton title="Save profile" type="submit" isLoading={saving} className="w-full" />
        </div>
      </FormProvider>
    </div>
  )
}
