'use client'

import Link from 'next/link'

import { MerchantOrgSettingsPanel } from '@/app/merchant/_components/merchant-org-settings-panel'

export default function MerchantSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
          Organization settings
        </h1>
        <p className="text-slate-500 text-xs">
          Timezone, address, and links to PayPal / policy change requests.
        </p>
      </div>

      <MerchantOrgSettingsPanel />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/merchant/settings/paypal"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-800 hover:border-amber-300"
        >
          PayPal account →
        </Link>
        <Link
          href="/merchant/settings/policies"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-800 hover:border-amber-300"
        >
          Cancellation policies →
        </Link>
      </div>
    </div>
  )
}
