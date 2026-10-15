'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { SignInForm } from '@/components/auth/sign-in-form'
import { useBookingContext } from '@/hooks/use-booking-context'

interface SplitBookingAuthProps {
  bookingSummary: ReactNode
  returnPath?: string
}

/**
 * Split-screen auth (PRD §2.3.4) — preserves booking draft while the client signs in.
 */
export function SplitBookingAuth({ bookingSummary, returnPath = '/book' }: SplitBookingAuthProps) {
  const { pauseForAuth } = useBookingContext()

  useEffect(() => {
    pauseForAuth(returnPath)
  }, [pauseForAuth, returnPath])

  return (
    <div className="grid min-h-[70vh] gap-8 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Your appointment</h2>
        <div className="mt-4 text-sm text-slate-600">{bookingSummary}</div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Sign in to continue</h2>
        <SignInForm
          portal="client"
          onForgotPassword={() => {
            pauseForAuth(returnPath)
            window.location.href = '/forgot-password?portal=client'
          }}
          successMessage="Signed in — resuming your booking"
        />
      </section>
    </div>
  )
}
