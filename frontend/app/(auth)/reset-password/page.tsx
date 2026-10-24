import { Suspense } from 'react'

import { ResetPasswordView } from '@/components/auth/ResetPasswordView'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
          <h1 className="mb-2 font-semibold text-2xl text-slate-900">Reset password</h1>
          <p className="text-slate-600 text-sm">Loading…</p>
        </main>
      }
    >
      <ResetPasswordView />
    </Suspense>
  )
}
