'use client'

import { Scissors, ShieldCheck, Sparkles } from 'lucide-react'

import { useAuthModal } from '@/components/auth/auth-context'
import { AuthModalShell } from '@/components/auth/auth-modal-shell'
import { AuthViewTabs } from '@/components/auth/auth-view-tabs'
import { DemoPersonasPanel } from '@/components/auth/demo-personas-panel'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { SignInForm } from '@/components/auth/sign-in-form'

import { ADMIN_DEMO_PERSONAS } from '../_constants/demo-personas'

export function AdminAuthModal() {
  const { isOpen, view, setView } = useAuthModal()

  if (!isOpen) return null

  const title =
    view === 'sign-in'
      ? 'Sign In to Platform Admin'
      : view === 'forgot-password'
        ? 'Password Recovery'
        : 'Admin Demo Accounts'

  const description =
    view === 'sign-in'
      ? 'Access salon approvals, commission, and platform controls'
      : view === 'forgot-password'
        ? 'Enter your email to receive a password reset token'
        : 'Select a seeded admin persona for platform testing'

  return (
    <AuthModalShell
      title={title}
      description={description}
      icon={
        view === 'demo-personas' ? (
          <Sparkles className="h-6 w-6" />
        ) : view === 'sign-in' ? (
          <ShieldCheck className="h-6 w-6" />
        ) : (
          <Scissors className="h-6 w-6" />
        )
      }
      tabs={
        view !== 'forgot-password' ? (
          <AuthViewTabs
            value={view === 'sign-up' ? 'sign-in' : view}
            onChange={(next) => {
              // Admin has no public sign-up endpoint in the Postman collection.
              if (next === 'sign-up') {
                setView('sign-in')
                return
              }
              setView(next)
            }}
            options={[
              { label: 'Sign In', value: 'sign-in' },
              { label: 'Demo', value: 'demo-personas', accent: true },
            ]}
          />
        ) : undefined
      }
    >
      {(view === 'sign-in' || view === 'sign-up') && (
        <SignInForm
          portal="admin"
          onForgotPassword={() => setView('forgot-password')}
          onOpenDemo={() => setView('demo-personas')}
        />
      )}
      {view === 'forgot-password' && (
        <ForgotPasswordForm onBackToSignIn={() => setView('sign-in')} />
      )}
      {view === 'demo-personas' && (
        <DemoPersonasPanel personas={ADMIN_DEMO_PERSONAS} showJudgeDemo />
      )}
    </AuthModalShell>
  )
}
