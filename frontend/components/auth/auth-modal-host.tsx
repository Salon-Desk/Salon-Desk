'use client'

import { AdminAuthModal } from '@/app/admin/_components/admin-auth-modal'
import { ClientAuthModal } from '@/app/client/_components/client-auth-modal'
import { MerchantAuthModal } from '@/app/merchant/_components/merchant-auth-modal'
import { useAuthModal } from '@/components/auth/auth-context'

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
