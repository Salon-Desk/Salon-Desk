'use client'

import { usePathname } from 'next/navigation'
import React, { Suspense, useEffect } from 'react'
import { Provider, useDispatch } from 'react-redux'
import { Toaster } from 'sonner'

import { AuthProvider } from '@/components/auth/auth-context'
import { AuthModalHost } from '@/components/auth/auth-modal-host'
import { ChatWidget } from '@/components/chat'
import { type AppDispatch, store } from '@/store'
import { hydrateAdminDemo, readAdminDemoFromStorage } from '@/store/adminDemoSlice'
import { type AppPortal, fetchAuthData, logout, setActiveApp } from '@/store/authSlice'
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
    void dispatch(fetchAuthData())
    const handleUnauthorized = () => {
      dispatch(logout())
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
  const onClientPortal =
    pathname === '/client' || pathname.startsWith('/client/') || pathname === '/book'
  if (onClientPortal) return null
  return <ChatWidget showTriggers />
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
