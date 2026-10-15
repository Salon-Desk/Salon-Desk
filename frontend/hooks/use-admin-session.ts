'use client'

import { useSelector } from 'react-redux'

import {
  isAdminUser,
  isAuthenticatedSelector,
  isLoadingSelector,
  userSelector,
} from '@/store/authSlice'

import { useClientHydrated } from './use-client-hydrated'

/** Gate platform admin RTK queries until an admin/staff session is ready. */
export function useAdminSession() {
  const hydrated = useClientHydrated()
  const user = useSelector(userSelector)
  const isAuthenticated = useSelector(isAuthenticatedSelector)
  const isLoading = useSelector(isLoadingSelector)
  const isAdmin = Boolean(isAuthenticated && user && isAdminUser(user))

  return {
    user,
    isAdmin,
    isLoading,
    skipAdminApi: !hydrated || isLoading || !isAdmin,
  }
}
