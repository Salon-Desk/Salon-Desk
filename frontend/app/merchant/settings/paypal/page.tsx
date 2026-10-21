'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function MerchantPaypalSettingsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/merchant/settings?tab=paypal')
  }, [router])
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Redirecting to Settings…
    </div>
  )
}
