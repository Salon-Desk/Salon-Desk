import { Suspense } from 'react'

import { ResetPasswordView } from '@/components/auth/ResetPasswordView'
import { LoadingSpinner } from '@/components/loader/LoadingSpinner'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
          <LoadingSpinner size="md" text="Loading…" />
        </main>
      }
    >
      <ResetPasswordView />
    </Suspense>
  )
}
