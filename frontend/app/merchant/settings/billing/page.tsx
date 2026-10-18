'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Legacy path — billing is a top-level merchant section. */
export default function MerchantBillingSettingsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/merchant/billing')
  }, [router])
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 text-sm text-slate-500">
      Redirecting to Billing…
    </div>
  )
}
