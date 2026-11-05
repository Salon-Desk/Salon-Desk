'use client'

import type { FC } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import { z } from 'zod'

import { PrimaryButton } from '@/components/button'
import FormProvider from '@/components/forms/FormProvider'
import RHFAvatarImage from '@/components/forms/RHFAvatarImage'
import RHFTextField from '@/components/forms/RHFTextField'
import { toastColor } from '@/constant/toast-color'
import { zodResolver } from '@/lib/schema/resolver'
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from '@/store/api/sharedApi'
import { userSelector } from '@/store/authSlice'

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  handle: z
    .string()
    .max(50, 'Handle must be 50 characters or fewer')
    .regex(/^@?[a-zA-Z0-9_.-]*$/, 'Handle may only contain letters, numbers, underscores, and dots')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
  middle_name: z.string().optional(),
  picture: z.any().optional(),
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
  const [uploadAvatar, { isLoading: uploadingAvatar }] = useUploadAvatarMutation()

  const methods = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      first_name: profile?.first_name || user?.first_name || '',
      last_name: profile?.last_name || user?.last_name || '',
      handle: profile?.handle || '',
      phone: profile?.phone || '',
      middle_name: profile?.middle_name || '',
      picture: profile?.picture || null,
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    try {
      let pictureUrl: string | null = profile?.picture ?? null

      if (data.picture instanceof File) {
        const formData = new FormData()
        formData.append('file', data.picture)
        const updatedProfile = await uploadAvatar(formData).unwrap()
        pictureUrl = updatedProfile.picture ?? null
      } else if (data.picture === null) {
        pictureUrl = null
      }

      const cleanHandle = data.handle?.trim().replace(/^@/, '').toLowerCase() || null

      await updateProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        middle_name: data.middle_name || null,
        phone: data.phone || null,
        picture: pictureUrl,
        handle: cleanHandle,
      }).unwrap()

      toast.success('Profile updated successfully', toastColor.success)
    } catch (err) {
      toast.error(
        String((err as { data?: { detail?: string } })?.data?.detail || 'Update failed'),
        toastColor.error,
      )
    }
  }

  const isBusy = saving || uploadingAvatar

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
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex justify-center pb-2">
            <RHFAvatarImage name="picture" label="Profile Photo" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RHFTextField name="first_name" label="First name" isRequired />
            <RHFTextField name="last_name" label="Last name" isRequired />
          </div>
          <RHFTextField
            name="handle"
            label="Personal Handle"
            placeholder="e.g. alex_hair"
            leftIcon="user"
            isRequired={false}
          />
          <RHFTextField name="middle_name" label="Middle name" />
          <RHFTextField name="phone" label="Phone" />

          <PrimaryButton
            title={isBusy ? 'Saving…' : 'Save profile'}
            type="submit"
            isLoading={isBusy}
            className="w-full"
          />
        </div>
      </FormProvider>
    </div>
  )
}
