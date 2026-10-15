'use client'

import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'
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

function SessionBootstrap({ children }: { children: React.ReactNode }) {
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

function GlobalChatWidget() {
  const pathname = usePathname()
  const onClientPortal =
    pathname === '/client' || pathname.startsWith('/client/') || pathname === '/book'
  if (onClientPortal) return null
  return <ChatWidget showTriggers />
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <SessionBootstrap>
          {children}
          <GlobalChatWidget />
          <AuthModalHost />
          <Toaster position="top-right" duration={3500} richColors closeButton />
        </SessionBootstrap>
      </AuthProvider>
    </Provider>
  )
}
