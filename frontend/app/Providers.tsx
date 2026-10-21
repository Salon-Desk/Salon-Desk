'use client'

import { usePathname } from 'next/navigation'
import React, { Suspense, useEffect } from 'react'
import { Provider, useDispatch } from 'react-redux'
import { Toaster } from 'sonner'

import { AuthProvider } from '@/components/auth/auth-context'
import { AuthModalHost } from '@/components/auth/auth-modal-host'
import { ChatWidget } from '@/components/chat'
import { portalFromPathname } from '@/lib/assistant-portal'
import { getPortalAuthToken, getPortalAuthUser } from '@/lib/authSession'
import { type AppDispatch, store } from '@/store'
import { hydrateAdminDemo, readAdminDemoFromStorage } from '@/store/adminDemoSlice'
import { hydrateFabPositionFromStorage } from '@/store/agentChatSlice'
import {
  type AppPortal,
  fetchAuthData,
  hydratePortalSession,
  logout,
  setActiveApp,
} from '@/store/authSlice'
import { hydrateClientDemo, readClientDemoFromStorage } from '@/store/clientDemoSlice'
import { hydrateMerchantDemo, readMerchantDemoFromStorage } from '@/store/merchantDemoSlice'

interface ProvidersProps {
  children: React.ReactNode
}

/** Runs once on the client — no navigation hooks (safe during static prerender). */
function ClientSessionInit({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(hydrateMerchantDemo(readMerchantDemoFromStorage()))
    dispatch(hydrateAdminDemo(readAdminDemoFromStorage()))
    dispatch(hydrateClientDemo(readClientDemoFromStorage()))
    dispatch(hydrateFabPositionFromStorage())

    // Restore sessions for each of the 3 apps independently if tokens exist
    const portals: AppPortal[] = ['client', 'merchant', 'admin']
    for (const portal of portals) {
      const token = getPortalAuthToken(portal)
      const user = getPortalAuthUser(portal)
      if (token) {
        dispatch(hydratePortalSession({ portal, token, user }))
        void dispatch(fetchAuthData(portal))
      }
    }

    const handleUnauthorized = (event: Event) => {
      const customEvent = event as CustomEvent<{ portal?: AppPortal }>
      const portal = customEvent.detail?.portal
      dispatch(logout(portal))
    }
    window.addEventListener('salondesk:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('salondesk:unauthorized', handleUnauthorized)
    }
  }, [dispatch])

  return <>{children}</>
}

function ActiveAppSync() {
  const dispatch = useDispatch<AppDispatch>()
  const pathname = usePathname()

  useEffect(() => {
    let app: AppPortal = 'client'
    if (pathname.startsWith('/admin')) {
      app = 'admin'
    } else if (pathname.startsWith('/merchant') || pathname.startsWith('/org')) {
      app = 'merchant'
    }
    dispatch(setActiveApp(app))
  }, [pathname, dispatch])

  return null
}

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

function GlobalChatWidget() {
  return (
    <Suspense fallback={null}>
      <GlobalChatWidgetInner />
    </Suspense>
  )
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ClientSessionInit>
          {children}
          <Suspense fallback={null}>
            <ActiveAppSync />
          </Suspense>
          <GlobalChatWidget />
          <AuthModalHost />
          <Toaster position="top-right" duration={3500} richColors closeButton />
        </ClientSessionInit>
      </AuthProvider>
    </Provider>
  )
}
