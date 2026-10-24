'use client'

import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'

import { useToast } from '@/hooks'

export interface AdminContextValue {
  message: string | null
  showToast: (msg: string) => void
}

const AdminContext = createContext<AdminContextValue | null>(null)

/** Shared toast for admin portal chrome. Live data comes from `platformApi` RTK hooks. */
export function AdminProvider({ children }: { children: ReactNode }) {
  const { message, show: showToast } = useToast(3800)

  return <AdminContext.Provider value={{ message, showToast }}>{children}</AdminContext.Provider>
}

export function useAdminContext() {
  const ctx = useContext(AdminContext)
  if (!ctx) {
    throw new Error('useAdminContext must be used within an <AdminProvider>')
  }
  return ctx
}
