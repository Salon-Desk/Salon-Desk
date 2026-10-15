'use client'

import { useSelector } from 'react-redux'

import {
  isAuthenticatedSelector,
  isLoadingSelector,
  isMerchantUser,
  userSelector,
} from '@/store/authSlice'

import { useClientHydrated } from './use-client-hydrated'

/** Gate org RTK queries until merchant session is known on the client. */
export function useMerchantSession() {
  const hydrated = useClientHydrated()
  const user = useSelector(userSelector)
  const isAuthenticated = useSelector(isAuthenticatedSelector)
  const isLoading = useSelector(isLoadingSelector)
  const isMerchant = Boolean(isAuthenticated && user && isMerchantUser(user))

  return {
    hydrated,
    user,
    isMerchant,
    isLoading,
    skipOrgApi: !hydrated || isLoading || !isMerchant,
  }
}
