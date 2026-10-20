'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function MerchantPaypalSettingsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/merchant/settings?tab=paypal')
  }, [router])
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 text-sm text-slate-500">
      Redirecting to Settings…
    </div>
  )
}
