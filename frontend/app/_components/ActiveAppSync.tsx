'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import type { AppDispatch } from '@/store'
import { type AppPortal, setActiveApp } from '@/store/authSlice'

export function ActiveAppSync() {
  const dispatch = useDispatch<AppDispatch>()
  const pathname = usePathname()

  useEffect(() => {
    let app: AppPortal = 'client'
    if (pathname.startsWith('/admin')) {
      app = 'admin'
    } else if (pathname.startsWith('/merchant') || pathname.startsWith('/org')) {
      app = 'merchant'
    }
    dispatch(setActiveApp(app))
  }, [pathname, dispatch])

  return null
}
