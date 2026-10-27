'use client'

import { Sparkles, Store } from 'lucide-react'

import { useAuthModal } from '@/components/auth/AuthContext'
import { AuthModalShell } from '@/components/auth/AuthModalShell'
import { AuthViewTabs } from '@/components/auth/AuthViewTabs'
import { DemoPersonasPanel } from '@/components/auth/DemoPersonasPanel'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { SignInForm } from '@/components/auth/SignInForm'

import { MERCHANT_DEMO_PERSONAS } from '../_constants/demo-personas'
import { MerchantSignUpForm } from './MerchantSignUpForm'

export { MerchantSignUpForm }

export function MerchantAuthModal() {
  const { isOpen, view, setView } = useAuthModal()

  if (!isOpen) return null

  const title =
    view === 'sign-in'
      ? 'Sign In to Salon Console'
      : view === 'sign-up'
        ? 'Register Salon & Owner'
        : view === 'forgot-password'
          ? 'Password Recovery'
          : 'Merchant Demo Accounts'

  const description =
    view === 'sign-in'
      ? 'Manage staff, schedules, and PayPal payouts'
      : view === 'sign-up'
        ? 'Create your organization owner account and salon'
        : view === 'forgot-password'
          ? 'Enter your email to receive a password reset token'
          : 'Seeded salon logins: Abi Beauty Salon staff, plus owners from the catalog'

  return (
    <AuthModalShell
      title={title}
      description={description}
      icon={
        view === 'demo-personas' ? <Sparkles className="h-6 w-6" /> : <Store className="h-6 w-6" />
      }
      tabs={
        view !== 'forgot-password' ? (
          <AuthViewTabs
            value={view}
            onChange={setView}
            options={[
              { label: 'Sign In', value: 'sign-in' },
              { label: 'Salon Owner', value: 'sign-up' },
              { label: 'Demo', value: 'demo-personas', accent: true },
            ]}
          />
        ) : undefined
      }
    >
      {view === 'sign-in' && (
        <SignInForm portal="merchant" onForgotPassword={() => setView('forgot-password')} />
      )}
      {view === 'sign-up' && <MerchantSignUpForm />}
      {view === 'forgot-password' && (
        <ForgotPasswordForm onBackToSignIn={() => setView('sign-in')} />
      )}
      {view === 'demo-personas' && <DemoPersonasPanel personas={MERCHANT_DEMO_PERSONAS} />}
    </AuthModalShell>
  )
}
