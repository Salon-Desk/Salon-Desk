import { Suspense } from 'react'

import { VerifyEmailView } from '@/components/auth/VerifyEmailView'
import { LoadingSpinner } from '@/components/loader/LoadingSpinner'

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 text-center">
          <LoadingSpinner size="md" text="Loading…" />
        </main>
      }
    >
      <VerifyEmailView />
    </Suspense>
  )
}
