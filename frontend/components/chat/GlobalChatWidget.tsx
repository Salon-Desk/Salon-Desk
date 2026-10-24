'use client'

import { usePathname } from 'next/navigation'
import { Suspense } from 'react'

import { portalFromPathname } from '@/lib/assistant-portal'

import { ChatWidget } from './ChatWidget'

function GlobalChatWidgetInner() {
  const pathname = usePathname()
  const isClientPortal = pathname.startsWith('/client') || pathname.startsWith('/book')
  const isMerchantPortal = pathname.startsWith('/merchant') || pathname.startsWith('/org')
  const isAdminPortal = pathname.startsWith('/admin')

  // FAB is visible ONLY for admin, merchant, and client. Not shown on landing app hub (/)
  if (!isClientPortal && !isMerchantPortal && !isAdminPortal) {
    return null
  }

  const portal = portalFromPathname(pathname)
  return <ChatWidget showTriggers portal={portal} />
}

export function GlobalChatWidget() {
  return (
    <Suspense fallback={null}>
      <GlobalChatWidgetInner />
    </Suspense>
  )
}
