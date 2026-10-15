'use client'

import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'

import { type DemoResetStats, useDemoReset, useToast } from '@/hooks'
import { resetAllDemoStores } from '@/lib/sandbox/demo-reset'

export interface AdminContextValue {
  isResetting: boolean
  message: string | null
  showToast: (msg: string) => void
  handleResetData: () => Promise<DemoResetStats | null>
}

const AdminContext = createContext<AdminContextValue | null>(null)

/** Sandbox demo reset + toasts. Live admin data comes from `platformApi` RTK hooks. */
export function AdminProvider({ children }: { children: ReactNode }) {
  const { message, show: showToast } = useToast(3800)
  const { isResetting, reset: handleResetData } = useDemoReset(resetAllDemoStores)

  return (
    <AdminContext.Provider value={{ isResetting, message, showToast, handleResetData }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdminContext() {
  const ctx = useContext(AdminContext)
  if (!ctx) {
    throw new Error('useAdminContext must be used within an <AdminProvider>')
  }
  return ctx
}
