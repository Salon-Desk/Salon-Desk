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
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Redirecting to Billing…
    </div>
  )
}
