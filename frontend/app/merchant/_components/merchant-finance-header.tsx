'use client'

import { ChevronRight, Clock, CreditCard, Receipt, Shield, Sliders } from 'lucide-react'
import Link from 'next/link'

import type { MerchantFinanceSettingsMode } from './merchant-finance-settings'

interface MerchantFinanceHeaderProps {
  mode: MerchantFinanceSettingsMode
  pathname: string
  orgName?: string | null
  activePolicyOrgName?: string | null
  timezone?: string | null
  currency?: string | null
  isLoading: boolean
}

export function MerchantFinanceHeader({
  mode,
  pathname,
  orgName,
  activePolicyOrgName,
  timezone,
  currency,
  isLoading,
}: MerchantFinanceHeaderProps) {
  const isPaypal = mode === 'paypal' || pathname === '/merchant/settings/paypal'
  const isPolicies = mode === 'policies' || pathname === '/merchant/settings/policies'
  const isBilling =
    mode === 'billing' ||
    pathname === '/merchant/settings/billing' ||
    pathname === '/merchant/billing'
  const isOverview = !isPaypal && !isPolicies && !isBilling

  const modeTitle =
    mode === 'paypal'
      ? 'PayPal Payouts'
      : mode === 'policies'
        ? 'Cancellation Policies'
        : mode === 'billing'
          ? 'Commission Billing'
          : 'Finance'

  return (
    <div className="border-b border-slate-200/80 pb-5">
      {mode !== 'all' && (
        <nav
          aria-label="Breadcrumb"
          className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-500"
        >
          <Link
            href="/merchant/settings"
            className="inline-flex items-center gap-1 text-slate-500 transition-colors hover:text-slate-900"
          >
            <Sliders className="h-3 w-3 text-slate-400" />
            <span>Settings</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
          <span className="font-semibold text-slate-800">{modeTitle}</span>
        </nav>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            {mode === 'paypal'
              ? 'PayPal Payout Configuration'
              : mode === 'policies'
                ? 'Cancellation & No-Show Terms'
                : mode === 'billing'
                  ? 'Platform Commission Billing'
                  : 'Finance & Compliance Governance'}
          </h1>
          <p className="max-w-2xl text-xs leading-relaxed text-slate-500">
            {mode === 'paypal'
              ? 'Configure your merchant credentials and PayPal account ID for direct payment capture and authorization disbursements.'
              : mode === 'policies'
                ? 'Manage cancellation notice windows, client no-show penalty rates, and guarantee hold percentages.'
                : mode === 'billing'
                  ? 'Review accrued platform fees from booking-time commission snapshots and pay issued SalonDesk SaaS invoices.'
                  : 'Review operating timezone, payment processing rails, cancellation rules, and audit-logged governance changes.'}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {isLoading ? (
              <div className="flex items-center gap-2 py-0.5 animate-pulse">
                <div className="h-5 w-24 rounded-full bg-slate-200/80" />
                <div className="h-5 w-36 rounded-full bg-slate-200/80" />
                <div className="h-5 w-20 rounded-full bg-slate-200/80" />
              </div>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {orgName || activePolicyOrgName || 'Salon'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                  <Clock className="h-3 w-3 text-slate-400" />
                  Timezone: {timezone || 'Africa/Addis_Ababa'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                  <span className="font-semibold text-slate-500">$</span>
                  Currency: {currency || 'USD'}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar py-0.5">
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200/70 bg-slate-100/90 p-1 text-xs shadow-2xs shrink-0">
            <Link
              href="/merchant/settings"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                isOverview
                  ? 'border border-slate-200/60 bg-white font-semibold text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
              <span>Overview</span>
            </Link>
            <Link
              href="/merchant/settings/paypal"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                isPaypal
                  ? 'border border-slate-200/60 bg-white font-semibold text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5 text-sky-600" />
              <span>PayPal</span>
            </Link>
            <Link
              href="/merchant/settings/policies"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                isPolicies
                  ? 'border border-slate-200/60 bg-white font-semibold text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span>Policies</span>
            </Link>
            <Link
              href="/merchant/billing"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
                isBilling
                  ? 'border border-slate-200/60 bg-white font-semibold text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              <Receipt className="h-3.5 w-3.5 text-amber-700" />
              <span>Billing</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
