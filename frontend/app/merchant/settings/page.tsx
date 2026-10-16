'use client'

import { ArrowRight, CreditCard, Shield } from 'lucide-react'
import Link from 'next/link'

import { MerchantOrgSettingsPanel } from '@/app/merchant/_components/merchant-org-settings-panel'
import { Card } from '@/components/ui'

export default function MerchantSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 animate-in fade-in duration-300">
      <div>
        <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
          Salon Settings
        </h1>
        <p className="text-slate-500 text-xs">
          Manage location, operating timezone, PayPal disbursement rails, and cancellation guarantee
          rules.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Location & Timezone Panel */}
        <div className="lg:col-span-7">
          <MerchantOrgSettingsPanel />
        </div>

        {/* Quick Config Cards */}
        <div className="space-y-4 lg:col-span-5">
          <Card
            padding="lg"
            className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">PayPal Merchant Account</h3>
                <p className="text-[11px] text-slate-500">Payment processor connection</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Configure sandbox or production PayPal merchant account ID to receive captured
              authorization funds.
            </p>
            <Link
              href="/merchant/settings/paypal"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 pt-1"
            >
              <span>Manage PayPal Credentials</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          <Card
            padding="lg"
            className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Cancellation &amp; No-Show Policy
                </h3>
                <p className="text-[11px] text-slate-500">Guaranteed authorization terms</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Customize free cancellation notice windows and client no-show penalty rates.
            </p>
            <Link
              href="/merchant/settings/policies"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 pt-1"
            >
              <span>Amend Policy Rules</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
