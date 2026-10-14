'use client'

import React from 'react'
import { Provider } from 'react-redux'
import { Toaster } from 'sonner'

import { AuthProvider } from '@/components/auth/auth-context'
import { AuthModalHost } from '@/components/auth/auth-modal-host'
import { store } from '@/store/app'

import InnerWrapper from './InnerWrapper'

interface ClientWrapperProps {
  children: React.ReactNode
}

const ClientWrapper = ({ children }: ClientWrapperProps) => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <InnerWrapper>
          {children}
          <AuthModalHost />
          <Toaster position="top-right" duration={3500} richColors closeButton />
        </InnerWrapper>
      </AuthProvider>
    </Provider>
  )
}

export default ClientWrapper
