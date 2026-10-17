'use client'

import { useEffect } from 'react'

/** Registers the app-shell service worker in production only; dev keeps HMR clean. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => void reg.unregister())
      })
      return
    }
    void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
  }, [])

  return null
}
