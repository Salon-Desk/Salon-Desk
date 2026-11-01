'use client'

import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { getPortalAuthToken, getPortalAuthUser } from '@/lib/authSession'
import { detectPortal } from '@/lib/axios'
import type { AppDispatch } from '@/store'
import { hydrateAdminDemo, readAdminDemoFromStorage } from '@/store/adminDemoSlice'
import { hydrateFabPositionFromStorage } from '@/store/agentChatSlice'
import {
  type AppPortal,
  fetchAuthData,
  hydratePortalSession,
  logout,
  setActiveApp,
} from '@/store/authSlice'
import { hydrateClientDemo, readClientDemoFromStorage } from '@/store/clientDemoSlice'
import { hydrateMerchantDemo, readMerchantDemoFromStorage } from '@/store/merchantDemoSlice'

/** Runs once on the client — no navigation hooks (safe during static prerender). */
export function ClientSessionInit({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(hydrateMerchantDemo(readMerchantDemoFromStorage()))
    dispatch(hydrateAdminDemo(readAdminDemoFromStorage()))
    dispatch(hydrateClientDemo(readClientDemoFromStorage()))
    dispatch(hydrateFabPositionFromStorage())

    const currentPortal = detectPortal()
    dispatch(setActiveApp(currentPortal))

    // Restore sessions for each of the 3 apps independently if tokens exist
    const portals: AppPortal[] = ['client', 'merchant', 'admin']
    for (const portal of portals) {
      const token = getPortalAuthToken(portal)
      const user = getPortalAuthUser(portal)
      if (token) {
        dispatch(hydratePortalSession({ portal, token, user }))
        void dispatch(fetchAuthData(portal))
      }
    }

    const handleUnauthorized = (event: Event) => {
      const customEvent = event as CustomEvent<{ portal?: AppPortal }>
      const portal = customEvent.detail?.portal
      dispatch(logout(portal))
    }
    window.addEventListener('salondesk:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('salondesk:unauthorized', handleUnauthorized)
    }
  }, [dispatch])

  return <>{children}</>
}
