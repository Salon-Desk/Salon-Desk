'use client'

import { CheckCircle2, Copy, CreditCard, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card } from '@/components/ui'
import type { ApiOrgAccount } from '@/types/api-org'

interface MerchantPaypalCardProps {
  account?: ApiOrgAccount | null
  orgName?: string
  merchantId: string
  copied: boolean
  submitting: boolean
  onCopyMerchantId: () => void
  onRequestChange: () => void
}

export function MerchantPaypalCard({
  account,
  orgName,
  merchantId,
  copied,
  submitting,
  onCopyMerchantId,
  onRequestChange,
}: MerchantPaypalCardProps) {
  return (
    <div className="space-y-6">
      <Card
        padding="lg"
        className="space-y-5 rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-blue-50 text-sky-800 shadow-2xs">
              <CreditCard className="h-5 w-5 text-sky-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">PayPal Merchant Account</h2>
              <p className="text-xs text-slate-500">
                Orders v2 direct capture disbursement connection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                account?.status === 'approved'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : account?.status === 'pending'
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-slate-300 bg-slate-50 text-slate-700'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  account?.status === 'approved'
                    ? 'animate-pulse bg-emerald-500'
                    : account?.status === 'pending'
                      ? 'animate-pulse bg-amber-500'
                      : 'bg-slate-400'
                }`}
              />
              {account?.status || 'unlinked'}
            </span>
          </div>
        </div>

        {/* Organization & Account Parameters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
              Assigned Salon Entity
            </span>
            <div className="truncate text-sm font-bold text-slate-900">
              {account?.org_name || orgName || '—'}
            </div>
            <span className="text-[11px] text-slate-500">
              ID: {account?.org_id ? account.org_id.slice(0, 13) + '…' : '—'}
            </span>
          </div>

          <div className="space-y-1 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
              Disbursement Currency
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{account?.currency || 'USD'}</span>
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Direct Payout
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Bank settle via PayPal Merchant Rail</span>
          </div>
        </div>

        {/* Verified Merchant ID with Copy */}
        <div className="space-y-2 rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50/60 to-slate-50/40 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-950">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              Verified PayPal Merchant Payer ID
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              {account?.approved_at
                ? `Verified ${new Date(account.approved_at).toLocaleDateString()}`
                : 'Live Rail'}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200/90 bg-white p-2.5 font-mono text-xs shadow-2xs">
            <span className="font-bold tracking-wide text-slate-900">{merchantId}</span>
            {account?.merchant_id ? (
              <button
                type="button"
                onClick={onCopyMerchantId}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                title="Copy Merchant ID"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-sans text-[11px] font-semibold text-emerald-700">
                      Copied
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="font-sans text-[11px]">Copy</span>
                  </>
                )}
              </button>
            ) : null}
          </div>

          {account?.merchant_email ? (
            <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
              <span>Account Email:</span>
              <span className="font-medium text-slate-800">{account.merchant_email}</span>
            </div>
          ) : null}
        </div>

        {/* Technical explainer */}
        <div className="space-y-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>How SalonDesk PayPal Authorization Holds Work</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 pt-1 text-[11px] sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200/60 bg-white p-2.5 shadow-2xs">
              <span className="mb-0.5 block font-bold text-slate-900">1. Zero-Debit Hold</span>
              <span>Client card is authorized at booking. No money charged up front.</span>
            </div>
            <div className="rounded-lg border border-slate-200/60 bg-white p-2.5 shadow-2xs">
              <span className="mb-0.5 block font-bold text-slate-900">2. Appointment</span>
              <span>Hold remains secure until client arrives at salon for appointment.</span>
            </div>
            <div className="rounded-lg border border-slate-200/60 bg-white p-2.5 shadow-2xs">
              <span className="mb-0.5 block font-bold text-slate-900">3. Payout Capture</span>
              <span>Capture routes funds directly to your verified PayPal account.</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-1 pt-2 md:flex-row">
          <PrimaryButton
            title="Request PayPal Account Change"
            variant="outline"
            size="sm"
            isDisabled={submitting}
            onClick={onRequestChange}
            icon={<ExternalLink className="h-3.5 w-3.5" />}
            className="h-10 rounded-xl text-xs font-semibold"
          />
          <span className="text-[11px] text-slate-400">Changes require compliance review</span>
        </div>
      </Card>
    </div>
  )
}
