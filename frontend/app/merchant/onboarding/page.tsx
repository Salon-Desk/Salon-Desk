'use client'

import Link from 'next/link'

import { OrgOwnerSignupForm } from '@/app/merchant/_components/OrgOwnerSignupForm'

export default function MerchantOnboardingPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Register your salon</h1>
      <p className="mt-2 mb-8 text-sm text-slate-600">
        Create an organization owner account. Your salon will appear in the platform review queue
        until approved.
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <OrgOwnerSignupForm />
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login?portal=merchant" className="text-amber-600 hover:text-amber-700">
          Sign in to the merchant console
        </Link>
      </p>
    </main>
  )
}
