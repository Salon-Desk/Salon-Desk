'use client'

import { useSelector } from 'react-redux'

import { isAdminUser, portalSessionSelector } from '@/store/authSlice'

import { useClientHydrated } from './use-client-hydrated'

/** Gate platform admin RTK queries until an admin/staff session is ready. */
export function useAdminSession() {
  const hydrated = useClientHydrated()
  const session = useSelector(portalSessionSelector('admin'))
  const user = session?.user ?? null
  const isAuthenticated = session?.isAuthenticated ?? false
  const isLoading = session?.isLoading ?? false
  const isAdmin = Boolean(isAuthenticated && user && isAdminUser(user))

  return {
    user,
    isAdmin,
    isLoading,
    skipAdminApi: !hydrated || isLoading || !isAdmin,
  }
}
