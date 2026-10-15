'use client'

import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Suspense } from 'react'

import { PortalGuard } from '@/components/layout/portal-guard'

/** Client catalog is public; PortalGuard only waits for session hydrate. */
export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <PortalGuard portal="client" allowAnonymous>
      <Suspense
        fallback={
          <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            <p className="text-xs text-slate-500">Loading…</p>
          </div>
        }
      >
        {children}
      </Suspense>
    </PortalGuard>
  )
}
