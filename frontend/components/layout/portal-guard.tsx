'use client'

import { Loader2, Lock } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useSelector } from 'react-redux'

import { useAuthModal } from '@/components/auth/auth-context'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui'
import { useClientHydrated } from '@/hooks/use-client-hydrated'
import { ROUTES } from '@/lib/constants'
import {
  type AppPortal,
  isAdminUser,
  isAuthenticatedSelector,
  isClientUser,
  isLoadingSelector,
  isMerchantUser,
  userSelector,
} from '@/store/authSlice'

interface PortalGuardProps {
  portal: AppPortal
  children: ReactNode
  /** When true, unauthenticated users still see children (client catalog). */
  allowAnonymous?: boolean
}

function roleAllowed(portal: AppPortal, user: ReturnType<typeof userSelector>): boolean {
  if (!user) return false
  if (portal === 'admin') return isAdminUser(user)
  if (portal === 'merchant') return isMerchantUser(user)
  return isClientUser(user)
}

/**
 * Gates portal UI on Redux session + role. Waits for fetchAuthData before deciding.
 */
function PortalGuardLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      <p className="text-xs text-slate-500">Checking session…</p>
    </div>
  )
}

export function PortalGuard({ portal, children, allowAnonymous = false }: PortalGuardProps) {
  const hydrated = useClientHydrated()
  const { openAuthModal } = useAuthModal()
  const user = useSelector(userSelector)
  const isAuthenticated = useSelector(isAuthenticatedSelector)
  const isLoading = useSelector(isLoadingSelector)

  if (!hydrated || isLoading) {
    return <PortalGuardLoading />
  }

  // Client catalog stays public; booking actions gate themselves.
  if (allowAnonymous) {
    return <>{children}</>
  }

  if (!isAuthenticated || !roleAllowed(portal, user)) {
    const title =
      portal === 'admin'
        ? 'Admin Console'
        : portal === 'merchant'
          ? 'Merchant Console'
          : 'Client Portal'
    const subtitle =
      portal === 'admin'
        ? 'Sign in with a platform admin or staff account to continue.'
        : portal === 'merchant'
          ? 'Sign in with an organization owner, reception, or stylist account.'
          : 'Sign in with a client account to continue.'

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <Logo size="md" linkToHome theme="light" />
            <h1 className="mt-4 font-bold text-lg text-slate-900">{title}</h1>
            <p className="mt-1 text-slate-500 text-xs leading-relaxed">{subtitle}</p>
            {isAuthenticated && user ? (
              <p className="mt-2 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-medium text-rose-700">
                Signed in as {user.role.replace('_', ' ')} — wrong portal for this account.
              </p>
            ) : null}
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => openAuthModal('sign-in', portal)}
          >
            <Lock className="h-4 w-4" />
            Sign in
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            className="mt-2"
            onClick={() => openAuthModal('demo-personas', portal)}
          >
            Demo personas
          </Button>

          <Link
            href={ROUTES.hub}
            className="mt-4 inline-flex w-full items-center justify-center font-semibold text-slate-500 text-xs hover:text-slate-800"
          >
            Back to App Hub
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
