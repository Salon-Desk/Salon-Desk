'use client'

import { usePathname } from 'next/navigation'
import React from 'react'
import { Provider } from 'react-redux'
import { Toaster } from 'sonner'

import { AuthProvider } from '@/components/auth/auth-context'
import { AuthModalHost } from '@/components/auth/auth-modal-host'
import { ChatWidget } from '@/components/chat'
import { store } from '@/store/app'

import InnerWrapper from './InnerWrapper'

interface ClientWrapperProps {
  children: React.ReactNode
}

/** Client portal already hosts AiConcierge — avoid a second FAB there. */
function GlobalChatWidget() {
  const pathname = usePathname()
  const onClientPortal =
    pathname === '/client' || pathname.startsWith('/client/') || pathname === '/book'
  if (onClientPortal) return null
  return <ChatWidget showTriggers />
}

const ClientWrapper = ({ children }: ClientWrapperProps) => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <InnerWrapper>
          {children}
          <GlobalChatWidget />
          <AuthModalHost />
          <Toaster position="top-right" duration={3500} richColors closeButton />
        </InnerWrapper>
      </AuthProvider>
    </Provider>
  )
}

export default ClientWrapper
