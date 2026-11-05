'use client'

import { Scissors, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { ADMIN_DEMO_PERSONAS } from '@/app/admin/_constants/demo-personas'
import { MERCHANT_DEMO_PERSONAS } from '@/app/merchant/_constants/demo-personas'
import { useAuthModal } from '@/components/auth/auth-context'
import { AuthModalShell } from '@/components/auth/auth-modal-shell'
import { AuthViewTabs } from '@/components/auth/auth-view-tabs'
import { DemoPersonasPanel } from '@/components/auth/demo-personas-panel'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { SignInForm } from '@/components/auth/sign-in-form'
import { useBookingContext } from '@/hooks/use-booking-context'

import { CLIENT_DEMO_PERSONAS } from '../_constants/demo-personas'
import { ClientSignUpForm } from './ClientSignUpForm'

export function ClientAuthModal() {
  const router = useRouter()
  const { isOpen, view, setView, targetPortal, closeAuthModal } = useAuthModal()
  const { draft, pending: bookingPending } = useBookingContext()

  if (!isOpen) return null

  const handleContinueAsGuest = () => {
    closeAuthModal()
    if (draft.returnPath) {
      router.push(draft.returnPath)
    }
  }

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
        <SignInForm portal="client" onForgotPassword={() => setView('forgot-password')} />
      )}
      {view === 'sign-up' && <ClientSignUpForm />}
      {view === 'forgot-password' && (
        <ForgotPasswordForm onBackToSignIn={() => setView('sign-in')} />
      )}
      {view === 'demo-personas' && <DemoPersonasPanel personas={demoPersonas} showJudgeDemo />}

      {(bookingPending || draft.returnPath) && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={handleContinueAsGuest}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 underline transition cursor-pointer"
          >
            Continue configuring booking as guest &rarr;
          </button>
        </div>
      )}
    </AuthModalShell>
  )
}
