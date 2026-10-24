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
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-violet-50/60 p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="relative">
          <span className="mb-2 inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-800">
            Organization controls
          </span>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Salon Settings
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
            Manage location, operating timezone, PayPal disbursement rails, cancellation guarantee
            rules, and account security.
          </p>
        </div>
      </div>

      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <MerchantOrgSettingsPanel />
          </div>

          <div className="space-y-4 lg:col-span-5">
            <Card
              padding="lg"
              className="space-y-3 rounded-2xl border border-slate-200/70 bg-white shadow-none"
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
