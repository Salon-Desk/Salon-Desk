'use client'

import { AlertTriangle, ArrowRight, CheckCircle2, Receipt, User } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { ChangePasswordForm } from '@/app/merchant/_components/ChangePasswordForm'
import { MerchantFinanceSettings } from '@/app/merchant/_components/MerchantFinanceSettings'
import { MerchantGeneralSettingsPanel } from '@/app/merchant/_components/MerchantGeneralSettingsPanel'
import { MerchantLocationHoursPanel } from '@/app/merchant/_components/MerchantLocationHoursPanel'
import { type SettingsTab, SettingsTabs } from '@/app/merchant/_components/SettingsTabs'
import { ProfileEditor } from '@/components/profile/ProfileEditor'
import { Card, PageHeader } from '@/components/ui'
import { computeMerchantOnboardingStatus } from '@/lib/onboarding/merchant-onboarding'
import {
  useGetMyCancellationPoliciesQuery,
  useGetMyOrgAccountQuery,
  useGetMyOrgSettingsQuery,
} from '@/store/api/orgApi'

export function MerchantSettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  const { data: account } = useGetMyOrgAccountQuery()
  const { data: settings } = useGetMyOrgSettingsQuery()
  const { data: policies } = useGetMyCancellationPoliciesQuery()

  const onboarding = useMemo(
    () => computeMerchantOnboardingStatus(account, settings, policies),
    [account, settings, policies],
  )

  const incompleteTabs: Partial<Record<SettingsTab, boolean>> = useMemo(
    () => ({
      'hours-location': !onboarding.isLocationComplete || !onboarding.isHoursComplete,
      paypal: !onboarding.isPaypalComplete,
      policies: !onboarding.isPolicyComplete,
    }),
    [onboarding],
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      <PageHeader
        variant="card"
        accent="violet"
        eyebrow="Organization controls"
        title="Salon Settings"
        description="Manage location, operating timezone, PayPal disbursement rails, cancellation guarantee rules, and account security."
      />

      {!onboarding.isFullyConfigured && (
        <Card
          padding="lg"
          className="space-y-4 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 shadow-none"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300/70 bg-amber-100/80 text-amber-900">
                <AlertTriangle className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Salon Setup Incomplete</h3>
                  <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    {3 - onboarding.incompleteCount} / 3 Completed
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Configure essential salon settings before accepting live client bookings.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-amber-200/60">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${Math.round(((3 - onboarding.incompleteCount) / 3) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-xs font-bold text-amber-900">
                {Math.round(((3 - onboarding.incompleteCount) / 3) * 100)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {onboarding.steps.map((step) => {
              const isSelected = activeTab === step.tab
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setActiveTab(step.tab)}
                  className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50/80 shadow-xs ring-1 ring-amber-400'
                      : step.isComplete
                        ? 'border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50/70'
                        : 'border-amber-200/80 bg-white hover:border-amber-300 hover:bg-amber-50/30'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {step.isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full border border-amber-400 bg-amber-100">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-600" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs font-bold text-slate-900">
                        {step.shortLabel}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          step.isComplete ? 'text-emerald-700' : 'text-amber-800'
                        }`}
                      >
                        {step.isComplete ? 'Ready' : 'Action needed'}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                      {step.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      <SettingsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        incompleteTabs={incompleteTabs}
      />

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <MerchantGeneralSettingsPanel />
          </div>

          <div className="space-y-4 lg:col-span-5">
            <Card
              padding="lg"
              className="space-y-3 rounded-2xl border border-slate-200/70 bg-white shadow-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Personal Staff Profile</h3>
                  <p className="text-[11px] text-slate-500">
                    Avatar photo &amp; user handle (@handle)
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Update your personal profile photo, unique username handle, and contact details
                separate from salon branding.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-sky-800 hover:text-sky-900 pt-1"
              >
                <span>Edit your personal profile</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Card>

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

      {activeTab === 'profile' && (
        <Card padding="lg" className="rounded-2xl border border-slate-200/70 bg-white shadow-none">
          <ProfileEditor
            title="Personal Staff Profile"
            description="Your individual profile photo, personal handle (@handle), and contact details distinct from salon branding."
          />
        </Card>
      )}

      {activeTab === 'hours-location' && <MerchantLocationHoursPanel />}

      {activeTab === 'paypal' && <MerchantFinanceSettings mode="paypal" />}

      {activeTab === 'policies' && <MerchantFinanceSettings mode="policies" />}

      {activeTab === 'security' && <ChangePasswordForm />}
    </div>
  )
}
