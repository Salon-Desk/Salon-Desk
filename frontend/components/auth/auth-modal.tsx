'use client'

/**
 * @deprecated Prefer portal-specific modals:
 * - ClientAuthModal (app/client)
 * - MerchantAuthModal (app/merchant)
 * - AdminAuthModal (app/admin)
 *
 * Kept as a thin re-export host for existing imports.
 */
export { AuthModalHost as AuthModal } from '@/components/auth/auth-modal-host'
