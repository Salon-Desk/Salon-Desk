'use client'

import { useRouter } from 'next/navigation'
import type { FC } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'

import { useAuthModal } from '@/components/auth/auth-context'
import { DemoAccountShortcuts } from '@/components/auth/demo-account-shortcuts'
import PrimaryButton from '@/components/button/PrimaryButton'
import FormProvider from '@/components/forms/FormProvider'
import RHFEmailField from '@/components/forms/RHFEmailField'
import RHFPasswordField from '@/components/forms/RHFPasswordField'
import useFormSubmitHandler from '@/hooks/formHandler'
import { useBookingContext } from '@/hooks/use-booking-context'
import { pathForUserRole } from '@/lib/authSession'
import { signInDefaultValues, type SignInFormData, signInSchema } from '@/lib/schema/auth'
import { zodResolver } from '@/lib/schema/resolver'
import type { AppDispatch } from '@/store'
import { useSignInMutation } from '@/store/api/sharedApi'
import {
  type AppPortal,
  isAdminUser,
  isMerchantUser,
  setActiveApp,
  setAuthData,
} from '@/store/authSlice'
import type { ApiResponse } from '@/types/api'
import type { TokenResponse } from '@/types/auth'
import type { User } from '@/types/user'

interface SignInFormProps {
  portal: AppPortal
  onForgotPassword: () => void
  onOpenDemo?: () => void
  successMessage?: string
}

const roleMatchesPortal = (portal: AppPortal, user: User | null | undefined) => {
  if (!user) return false
  if (portal === 'admin') return isAdminUser(user)
  if (portal === 'merchant') return isMerchantUser(user)
  return user.role === 'client'
}

export const SignInForm: FC<SignInFormProps> = ({
  portal,
  onForgotPassword,
  onOpenDemo,
  successMessage = 'Signed in successfully',
}) => {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { closeAuthModal } = useAuthModal()
  const { resumeAfterAuth, pending: bookingPending } = useBookingContext()
  const [signIn, { isLoading }] = useSignInMutation()

  const methods = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: signInDefaultValues,
    mode: 'onBlur',
  })

  const onCompleteSuccess = (response: ApiResponse<TokenResponse>) => {
    const data = response.data
    if (!data?.access_token || !data.user) {
      throw new Error('Invalid sign-in response')
    }

    dispatch(
      setAuthData({
        user: data.user,
        access_token: data.access_token,
        organization_id: data.user.org_id || undefined,
        portal,
      }),
    )
    dispatch(setActiveApp(portal))
    closeAuthModal()

    if (bookingPending && portal === 'client' && resumeAfterAuth()) {
      return
    }

    const destination = roleMatchesPortal(portal, data.user)
      ? `/${portal}`
      : pathForUserRole(data.user.role)

    router.push(destination)
  }

  const submitHandler = useFormSubmitHandler<SignInFormData, TokenResponse>(
    (body: SignInFormData) =>
      signIn({
        email: body.email ?? '',
        password: body.password ?? '',
      })
        .unwrap()
        .then((data) => ({ data })),
    onCompleteSuccess,
    successMessage,
  )

  const onSubmit = async (data: SignInFormData) => {
    await submitHandler({
      email: (data.email ?? '').trim(),
      password: data.password ?? '',
    })
  }

  const handleFormSubmit = (e?: React.BaseSyntheticEvent) => {
    e?.preventDefault()
    void methods.handleSubmit(onSubmit)(e)
  }

  return (
    <FormProvider methods={methods} onSubmit={handleFormSubmit}>
      <div className="space-y-4">
        <RHFEmailField
          name="email"
          label="Email Address"
          placeholder="name@example.com"
          isRequired
        />

        <div className="space-y-1">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-medium text-amber-600 hover:text-amber-700"
            >
              Forgot password?
            </button>
          </div>
          <RHFPasswordField name="password" label="Password" placeholder="••••••••" isRequired />
        </div>

        <PrimaryButton
          title={isLoading ? 'Signing In...' : 'Sign In'}
          isLoading={isLoading}
          type="submit"
          size="sm"
          className="h-11 rounded-xl font-semibold shadow-none"
        />

        {onOpenDemo ? <DemoAccountShortcuts onOpenAll={onOpenDemo} /> : null}
      </div>
    </FormProvider>
  )
}
