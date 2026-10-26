'use client'

import type { ReactNode } from 'react'
import { Suspense } from 'react'

import { PortalGuard } from '@/components/layout/portal-guard'
import { LoadingSpinner } from '@/components/loader/LoadingSpinner'

/** Client catalog is public; PortalGuard only waits for session hydrate. */
export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <PortalGuard portal="client" allowAnonymous>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <LoadingSpinner size="md" text="Loading…" />
          </div>
        }
      >
        {children}
      </Suspense>
    </PortalGuard>
  )
}
