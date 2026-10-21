'use client'

import { ArrowRight, Receipt } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { ChangePasswordForm } from '@/app/merchant/_components/ChangePasswordForm'
import { MerchantFinanceSettings } from '@/app/merchant/_components/MerchantFinanceSettings'
import { MerchantOrgSettingsPanel } from '@/app/merchant/_components/MerchantOrgSettingsPanel'
import { type SettingsTab, SettingsTabs } from '@/app/merchant/_components/SettingsTabs'
import { Card } from '@/components/ui'

export function MerchantSettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 animate-in fade-in duration-300">
      <div>
        <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
          Salon Settings
        </h1>
        <p className="text-slate-500 text-xs">
          Manage location, operating timezone, PayPal disbursement rails, cancellation guarantee
          rules, and account security.
        </p>
      </div>

      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <MerchantOrgSettingsPanel />
          </div>

          <div className="space-y-4 lg:col-span-5">
            <Card
              padding="lg"
              className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Platform commission billing</h3>
                  <p className="text-[11px] text-slate-500">SaaS invoices &amp; accrual ledger</p>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Review accrued platform fees from booking-time commission snapshots and pay issued
                SalonDesk invoices.
              </p>
              <Link
                href="/merchant/billing"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 pt-1"
              >
                <span>Open Billing section</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'paypal' && <MerchantFinanceSettings mode="paypal" />}

      {activeTab === 'policies' && <MerchantFinanceSettings mode="policies" />}

      {activeTab === 'security' && <ChangePasswordForm />}
    </div>
  )
}
