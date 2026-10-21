'use client'

import { useRouter } from 'next/navigation'
import type { FC } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'

import { useAuthModal } from '@/components/auth/auth-context'
import FormProvider from '@/components/forms/FormProvider'
import RHFEmailField from '@/components/forms/RHFEmailField'
import RHFPasswordField from '@/components/forms/RHFPasswordField'
import RHFPhoneField from '@/components/forms/RHFPhoneField'
import RHFTextField from '@/components/forms/RHFTextField'
import PrimaryButton from '@/components/ui/primary-button'
import useFormSubmitHandler from '@/hooks/formHandler'
import { zodResolver } from '@/lib/schema/resolver'
import { toApiPhoneDigits } from '@/lib/util/phone'
import type { AppDispatch } from '@/store'
import { useSignUpMutation } from '@/store/api/sharedApi'
import { setActiveApp, setAuthData } from '@/store/authSlice'
import type { ApiResponse } from '@/types/api'
import type { SignUpRequest, TokenResponse } from '@/types/auth'

import {
  clientSignUpDefaultValues,
  type ClientSignUpFormData,
  clientSignUpSchema,
} from '../_schemas/auth.schema'

export const ClientSignUpForm: FC = () => {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { closeAuthModal } = useAuthModal()
  const [signUp, { isLoading }] = useSignUpMutation()

  const methods = useForm<ClientSignUpFormData>({
    resolver: zodResolver(clientSignUpSchema),
    defaultValues: clientSignUpDefaultValues,
    mode: 'onBlur',
  })

  const onCompleteSuccess = (response: ApiResponse<TokenResponse>) => {
    const data = response.data
    if (!data?.access_token || !data.user) {
      throw new Error('Invalid sign-up response')
    }

    dispatch(
      setAuthData({
        user: data.user,
        access_token: data.access_token,
        portal: 'client',
      }),
    )
    dispatch(setActiveApp('client'))
    closeAuthModal()
    router.push('/client')
  }

  const submitHandler = useFormSubmitHandler<SignUpRequest, TokenResponse>(
    (body: SignUpRequest) =>
      signUp(body)
        .unwrap()
        .then((data) => ({ data })),
    onCompleteSuccess,
    'Account created. Check your email to verify, then you can book.',
  )

  const onSubmit = async (data: ClientSignUpFormData) => {
    await submitHandler({
      first_name: (data.first_name ?? '').trim(),
      last_name: (data.last_name ?? '').trim(),
      email: (data.email ?? '').trim(),
      password: data.password ?? '',
      phone: toApiPhoneDigits(data.phone),
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
            label="First Name"
            placeholder="Jane"
            isRequired
            className="rounded-xl border-slate-200"
          />
          <RHFTextField
            name="last_name"
            label="Last Name"
            placeholder="Doe"
            isRequired
            className="rounded-xl border-slate-200"
          />
        </div>

        <RHFEmailField
          name="email"
          label="Email Address"
          placeholder="jane.doe@example.com"
          isRequired
          className="rounded-xl border-slate-200"
        />

        <RHFPhoneField
          name="phone"
          label="Phone Number"
          placeholder="+1 (555) 000-0000"
          className="rounded-xl border-slate-200"
        />

        <RHFPasswordField
          name="password"
          label="Password"
          placeholder="At least 8 characters"
          isRequired
          className="rounded-xl border-slate-200"
        />

        <div className="pt-2">
          <PrimaryButton
            title={isLoading ? 'Creating account…' : 'Create Account'}
            isLoading={isLoading}
            type="submit"
            size="default"
            className="h-11 w-full rounded-xl bg-slate-900 font-semibold text-white hover:bg-slate-800"
          />
        </div>
      </div>
    </FormProvider>
  )
}
