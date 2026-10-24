'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React from 'react'

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export function ResetPasswordView() {
  const params = useSearchParams()
  const token = params.get('token') ?? params.get('password_reset_token') ?? undefined

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-2 font-semibold text-2xl text-slate-900">Reset password</h1>
      <p className="mb-8 text-slate-600 text-sm">Choose a new password for your account.</p>
      <ForgotPasswordForm
        initialResetToken={token}
        onBackToSignIn={() => (window.location.href = '/login')}
      />
      <p className="mt-6 text-center text-slate-500 text-sm">
        <Link href="/login" className="text-amber-600 hover:text-amber-700">
          Return to sign in
        </Link>
      </p>
    </main>
  )
}
