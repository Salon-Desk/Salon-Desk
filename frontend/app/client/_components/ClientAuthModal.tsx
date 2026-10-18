'use client'

import { Scissors, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { FC } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'

import { ADMIN_DEMO_PERSONAS } from '@/app/admin/_constants/demo-personas'
import { MERCHANT_DEMO_PERSONAS } from '@/app/merchant/_constants/demo-personas'
import { useAuthModal } from '@/components/auth/auth-context'
import { AuthModalShell } from '@/components/auth/auth-modal-shell'
import { AuthViewTabs } from '@/components/auth/auth-view-tabs'
import { DemoPersonasPanel } from '@/components/auth/demo-personas-panel'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { SignInForm } from '@/components/auth/sign-in-form'
import PrimaryButton from '@/components/button/PrimaryButton'
import FormProvider from '@/components/forms/FormProvider'
import RHFEmailField from '@/components/forms/RHFEmailField'
import RHFPasswordField from '@/components/forms/RHFPasswordField'
import RHFPhoneField from '@/components/forms/RHFPhoneField'
import RHFTextField from '@/components/forms/RHFTextField'
import useFormSubmitHandler from '@/hooks/formHandler'
import { zodResolver } from '@/lib/schema/resolver'
import { toApiPhoneDigits } from '@/lib/util/phone'
import type { AppDispatch } from '@/store'
import { useSignUpMutation } from '@/store/api/sharedApi'
import { setActiveApp, setAuthData } from '@/store/authSlice'
import type { ApiResponse } from '@/types/api'
import type { SignUpRequest, TokenResponse } from '@/types/auth'

import { CLIENT_DEMO_PERSONAS } from '../_constants/demo-personas'
import {
  clientSignUpDefaultValues,
  type ClientSignUpFormData,
  clientSignUpSchema,
} from '../_schemas/auth.schema'

const ClientSignUpForm: FC = () => {
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
    'Account created successfully. Welcome to SalonDesk.',
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
            leftIcon="user"
            isRequired
          />
          <RHFTextField
            name="last_name"
            label="Last Name"
            placeholder="Doe"
            leftIcon="user"
            isRequired
          />
        </div>
        <RHFEmailField name="email" label="Email" placeholder="jane.doe@example.com" isRequired />
        <RHFPasswordField
          name="password"
          label="Password (min 8 chars)"
          placeholder="••••••••"
          isRequired
        />
        <RHFPhoneField
          name="phone"
          label="Phone Number"
          placeholder="+1 (555) 000-0000"
          isRequired={false}
        />
        <PrimaryButton
          title={isLoading ? 'Creating Account...' : 'Complete Registration'}
          isLoading={isLoading}
          type="submit"
          size="sm"
          className="mt-1 h-11 rounded-xl font-semibold shadow-none"
        />
      </div>
    </FormProvider>
  )
}

export function ClientAuthModal() {
  const { isOpen, view, setView, targetPortal } = useAuthModal()

  if (!isOpen) return null

  // Hub exposes the three primary seeded logins: client, salon owner, admin.
  const isHub = targetPortal == null
  const demoPersonas = isHub
    ? [CLIENT_DEMO_PERSONAS[0], MERCHANT_DEMO_PERSONAS[0], ADMIN_DEMO_PERSONAS[0]]
    : CLIENT_DEMO_PERSONAS

  const title =
    view === 'sign-in'
      ? 'Sign In to Client Booking'
      : view === 'sign-up'
        ? 'Create Client Account'
        : view === 'forgot-password'
          ? 'Password Recovery'
          : isHub
            ? 'Demo Accounts'
            : 'Client Demo Accounts'

  const description =
    view === 'sign-in'
      ? 'Book salon services with zero-risk authorization holds'
      : view === 'sign-up'
        ? 'Create your client account to start booking'
        : view === 'forgot-password'
          ? 'Enter your email to receive a password reset token'
          : isHub
            ? 'Sign in as the seeded client, salon owner, or platform admin'
            : 'Select a seeded client persona for the booking workflow'

  return (
    <AuthModalShell
      title={title}
      description={description}
      icon={
        view === 'demo-personas' ? (
          <Sparkles className="h-6 w-6" />
        ) : (
          <Scissors className="h-6 w-6" />
        )
      }
      tabs={
        view !== 'forgot-password' ? (
          <AuthViewTabs
            value={view}
            onChange={setView}
            options={[
              { label: 'Sign In', value: 'sign-in' },
              { label: 'Sign Up', value: 'sign-up' },
              { label: 'Demo', value: 'demo-personas', accent: true },
            ]}
          />
        ) : undefined
      }
    >
      {view === 'sign-in' && (
        <SignInForm
          portal="client"
          onForgotPassword={() => setView('forgot-password')}
          onOpenDemo={() => setView('demo-personas')}
        />
      )}
      {view === 'sign-up' && <ClientSignUpForm />}
      {view === 'forgot-password' && (
        <ForgotPasswordForm onBackToSignIn={() => setView('sign-in')} />
      )}
      {view === 'demo-personas' && <DemoPersonasPanel personas={demoPersonas} showJudgeDemo />}
    </AuthModalShell>
  )
}
