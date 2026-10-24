'use client'

import { useRouter } from 'next/navigation'
import type { FC } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'

import { useAuthModal } from '@/components/auth/AuthContext'
import { PrimaryButton } from '@/components/button'
import FormProvider from '@/components/forms/FormProvider'
import RHFEmailField from '@/components/forms/RHFEmailField'
import RHFPasswordField from '@/components/forms/RHFPasswordField'
import RHFPhoneField from '@/components/forms/RHFPhoneField'
import RHFTextArea from '@/components/forms/RHFTextArea'
import RHFTextField from '@/components/forms/RHFTextField'
import useFormSubmitHandler from '@/hooks/formHandler'
import { zodResolver } from '@/lib/schema/resolver'
import { toApiPhoneDigits } from '@/lib/util/phone'
import type { AppDispatch } from '@/store'
import { useSignUpOrgOwnerMutation } from '@/store/api/sharedApi'
import { setActiveApp, setAuthData } from '@/store/authSlice'
import type { ApiResponse } from '@/types/api'
import type { OrgOwnerSignUpRequest, OrgOwnerSignUpResponse } from '@/types/auth'

import {
  merchantSignUpDefaultValues,
  type MerchantSignUpFormData,
  merchantSignUpSchema,
} from '../_schemas/auth.schema'

export const MerchantSignUpForm: FC = () => {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { closeAuthModal } = useAuthModal()
  const [signUpOrgOwner, { isLoading }] = useSignUpOrgOwnerMutation()

  const methods = useForm<MerchantSignUpFormData>({
    resolver: zodResolver(merchantSignUpSchema),
    defaultValues: merchantSignUpDefaultValues,
    mode: 'onBlur',
  })

  const onCompleteSuccess = (response: ApiResponse<OrgOwnerSignUpResponse>) => {
    const data = response.data
    if (!data?.access_token || !data.user) {
      throw new Error('Invalid org-owner sign-up response')
    }

    dispatch(
      setAuthData({
        user: data.user,
        access_token: data.access_token,
        organization_id: data.organization_id,
        portal: 'merchant',
      }),
    )
    dispatch(setActiveApp('merchant'))
    closeAuthModal()
    router.push('/merchant')
  }

  const submitHandler = useFormSubmitHandler<OrgOwnerSignUpRequest, OrgOwnerSignUpResponse>(
    (body: OrgOwnerSignUpRequest) =>
      signUpOrgOwner(body)
        .unwrap()
        .then((data) => ({ data })),
    onCompleteSuccess,
    'Salon organization registered. Opening console...',
  )

  const onSubmit = async (data: MerchantSignUpFormData) => {
    await submitHandler({
      first_name: (data.first_name ?? '').trim(),
      last_name: (data.last_name ?? '').trim(),
      email: (data.email ?? '').trim(),
      password: data.password ?? '',
      phone: toApiPhoneDigits(data.phone),
      organization_name: (data.organization_name ?? '').trim(),
      physical_address: (data.physical_address ?? '').trim(),
      organization_description: data.organization_description?.trim() || undefined,
      timezone: 'UTC',
    })
  }

  return (
    <FormProvider
      methods={methods}
      onSubmit={(e) => {
        e?.preventDefault()
        void methods.handleSubmit(onSubmit)(e)
      }}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <RHFTextField
            name="first_name"
            label="Owner First Name"
            placeholder="Selam"
            leftIcon="user"
            isRequired
          />
          <RHFTextField
            name="last_name"
            label="Owner Last Name"
            placeholder="Tesfaye"
            leftIcon="user"
            isRequired
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RHFEmailField
            name="email"
            label="Owner Email"
            placeholder="owner@salon.com"
            isRequired
          />
          <RHFPasswordField
            name="password"
            label="Owner Password"
            placeholder="••••••••"
            isRequired
          />
        </div>
        <RHFPhoneField
          name="phone"
          label="Phone Number"
          placeholder="+1 (555) 000-0000"
          isRequired={false}
        />
        <RHFTextField
          name="organization_name"
          label="Salon / Organization Name"
          placeholder="Selam Hair & Beauty Studio"
          isRequired
        />
        <RHFTextField
          name="physical_address"
          label="Physical Address"
          placeholder="124 Bole Road, Addis Ababa"
          isRequired
        />
        <RHFTextArea
          name="organization_description"
          label="Salon Description"
          placeholder="Optional short description"
          isRequired={false}
          rows={2}
        />
        <PrimaryButton
          title={isLoading ? 'Registering Salon...' : 'Register Salon & Launch Console'}
          isLoading={isLoading}
          type="submit"
          size="sm"
          fullWidth="full"
          className="mt-1 h-11 rounded-xl font-semibold shadow-none"
        />
      </div>
    </FormProvider>
  )
}
