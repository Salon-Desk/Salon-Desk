'use client'

import React, { Suspense } from 'react'
import { Provider } from 'react-redux'
import { Toaster } from 'sonner'

import { AuthProvider } from '@/components/auth/auth-context'
import { AuthModalHost } from '@/components/auth/auth-modal-host'
import { GlobalChatWidget } from '@/components/chat'
import { store } from '@/store'

import { ActiveAppSync } from './_components/ActiveAppSync'
import { ClientSessionInit } from './_components/ClientSessionInit'

interface ProvidersProps {
  children: React.ReactNode
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
