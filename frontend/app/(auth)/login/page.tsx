import { Suspense } from 'react'

import { LoginView } from '@/components/auth/LoginView'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
          <h1 className="mb-2 font-semibold text-2xl text-slate-900">Sign in</h1>
          <p className="text-slate-600 text-sm">Loading…</p>
        </main>
      }
    >
      <LoginView />
    </Suspense>
  )
}
