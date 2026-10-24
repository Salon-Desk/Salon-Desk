import { Suspense } from 'react'

import { LoginView } from '@/components/auth/LoginView'
import { LoadingSpinner } from '@/components/loader/LoadingSpinner'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
          <LoadingSpinner size="md" text="Loading…" />
        </main>
      }
    >
      <LoginView />
    </Suspense>
  )
}
