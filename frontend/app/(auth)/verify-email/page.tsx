import { Suspense } from 'react'

import { VerifyEmailView } from '@/components/auth/VerifyEmailView'

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 text-center">
          <h1 className="mb-2 font-semibold text-2xl text-slate-900">Verify email</h1>
          <p className="text-slate-600 text-sm">Loading…</p>
        </main>
      }
    >
      <VerifyEmailView />
    </Suspense>
  )
}
