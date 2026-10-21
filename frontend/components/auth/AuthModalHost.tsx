'use client'

import { AdminAuthModal } from '@/app/admin/_components/AdminAuthModal'
import { ClientAuthModal } from '@/app/client/_components/ClientAuthModal'
import { MerchantAuthModal } from '@/app/merchant/_components/MerchantAuthModal'
import { useAuthModal } from '@/components/auth/AuthContext'

/**
 * Routes AuthProvider open state to the portal-specific auth modal.
 */
export function AuthModalHost() {
  const { isOpen, targetPortal } = useAuthModal()

  if (!isOpen) return null

  if (targetPortal === 'merchant') {
    return <MerchantAuthModal />
  }

  if (targetPortal === 'admin') {
    return <AdminAuthModal />
  }

  return <ClientAuthModal />
}
