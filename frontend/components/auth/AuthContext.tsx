'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'

import type { AppPortal } from '@/store/authSlice'

export type AuthModalView = 'sign-in' | 'sign-up' | 'forgot-password' | 'demo-personas'

interface AuthContextType {
  isOpen: boolean
  view: AuthModalView
  targetPortal?: AppPortal
  openAuthModal: (view?: AuthModalView, targetPortal?: AppPortal) => void
  closeAuthModal: () => void
  setView: (view: AuthModalView) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<AuthModalView>('sign-in')
  const [targetPortal, setTargetPortal] = useState<AppPortal | undefined>(undefined)

  const openAuthModal = useCallback((newView: AuthModalView = 'sign-in', portal?: AppPortal) => {
    setView(newView)
    setTargetPortal(portal)
    setIsOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isOpen,
        view,
        targetPortal,
        openAuthModal,
        closeAuthModal,
        setView,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthModal = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthProvider')
  }
  return context
}
