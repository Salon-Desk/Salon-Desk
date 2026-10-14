'use client'

import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import type { AppDispatch } from '@/store/app'
import { type AppPortal, fetchAuthData, logout, setActiveApp } from '@/store/authSlice'

interface InnerWrapperProps {
  children: React.ReactNode
}

const InnerWrapper = ({ children }: InnerWrapperProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const pathname = usePathname()

  // Sync activeApp with route
  useEffect(() => {
    let app: AppPortal = 'client'
    if (pathname.startsWith('/admin')) {
      app = 'admin'
    } else if (pathname.startsWith('/merchant') || pathname.startsWith('/org')) {
      app = 'merchant'
    }
    dispatch(setActiveApp(app))
  }, [pathname, dispatch])

  // Hydrate auth session on mount
  useEffect(() => {
    void dispatch(fetchAuthData())

    // Listen for unauthorized events dispatched by axios interceptor
    const handleUnauthorized = () => {
      dispatch(logout())
    }
    window.addEventListener('salondesk:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('salondesk:unauthorized', handleUnauthorized)
    }
  }, [dispatch])

  return <>{children}</>
}

export default InnerWrapper
