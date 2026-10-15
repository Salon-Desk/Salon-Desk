'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { SignInForm } from '@/components/auth/sign-in-form'
import type { AppPortal } from '@/store/authSlice'

const portalFromParam = (value: string | null): AppPortal => {
  if (value === 'admin' || value === 'merchant') return value
  return 'client'
}

function LoginPageContent() {
  const params = useSearchParams()
  const portal = portalFromParam(params.get('portal'))

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">Sign in</h1>
      <p className="mb-8 text-sm text-slate-600">
        Access your {portal === 'client' ? 'bookings' : portal} portal.
      </p>
      <SignInForm
        portal={portal}
        onForgotPassword={() => {
          window.location.href = `/forgot-password?portal=${portal}`
        }}
      />
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/" className="text-amber-600 hover:text-amber-700">
          Back to home
        </Link>
      </p>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">Sign in</h1>
          <p className="text-sm text-slate-600">Loading…</p>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
