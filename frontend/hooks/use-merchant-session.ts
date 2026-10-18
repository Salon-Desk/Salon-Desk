'use client'

import { useSelector } from 'react-redux'

import { isMerchantUser, portalSessionSelector } from '@/store/authSlice'

import { useClientHydrated } from './use-client-hydrated'

/** Gate org RTK queries until merchant session is known on the client. */
export function useMerchantSession() {
  const hydrated = useClientHydrated()
  const session = useSelector(portalSessionSelector('merchant'))
  const user = session?.user ?? null
  const isAuthenticated = session?.isAuthenticated ?? false
  const isLoading = session?.isLoading ?? false
  const isMerchant = Boolean(isAuthenticated && user && isMerchantUser(user))

  return {
    hydrated,
    user,
    isMerchant,
    isLoading,
    skipOrgApi: !hydrated || isLoading || !isMerchant,
  }
}
