'use client'

import type { ReactNode } from 'react'

import { PortalGuard } from '@/components/layout/portal-guard'

/** Client catalog is public; PortalGuard only waits for session hydrate. */
export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <PortalGuard portal="client" allowAnonymous>
      {children}
    </PortalGuard>
  )
}
