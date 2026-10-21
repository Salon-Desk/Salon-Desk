'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React from 'react'

import { SignInForm } from '@/components/auth/sign-in-form'
import type { AppPortal } from '@/store/authSlice'

const portalFromParam = (value: string | null): AppPortal => {
  if (value === 'admin' || value === 'merchant') return value
  return 'client'
}

export function LoginView() {
  const params = useSearchParams()
  const portal = portalFromParam(params.get('portal'))

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-2 font-semibold text-2xl text-slate-900">Sign in</h1>
      <p className="mb-8 text-slate-600 text-sm">
        Access your {portal === 'client' ? 'bookings' : portal} portal.
      </p>
      <SignInForm
        portal={portal}
        onForgotPassword={() => {
          window.location.href = `/forgot-password?portal=${portal}`
        }}
      />
      <p className="mt-6 text-center text-slate-500 text-sm">
        <Link href="/" className="text-amber-600 hover:text-amber-700">
          Back to home
        </Link>
      </p>
    </main>
  )
}
