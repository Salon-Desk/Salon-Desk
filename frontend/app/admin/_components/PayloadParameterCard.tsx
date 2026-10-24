'use client'

import { CheckCircle2, Copy, CreditCard, ShieldCheck } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

import { toastColor } from '@/constant/toast-color'
import type { ApiChangeRequest } from '@/types/api-org'

export function PayloadParameterCard({ cr }: { cr: ApiChangeRequest }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const payload = cr.payload_json as Record<string, unknown>

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success('Value copied to clipboard', toastColor.success)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  if (cr.request_type === 'PAYPAL_ACCOUNT') {
    const merchantId = String(payload.merchant_id || '—')
    const currency = String(payload.currency || 'USD')

    return (
      <div className="space-y-3 rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50/60 to-slate-50/40 p-4 text-slate-700 text-xs shadow-xs">
        <div className="flex items-center justify-between border-sky-100 border-b pb-2">
          <div className="flex items-center gap-2 font-bold text-sky-950">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 text-sky-700">
              <CreditCard className="h-3.5 w-3.5" />
            </div>
            <span>Proposed PayPal Merchant Payout Configuration</span>
          </div>
          <span className="rounded-md bg-sky-100 px-2 py-0.5 font-bold font-mono text-[10px] text-sky-800">
            Orders v2 Direct
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-xs">
            <span className="block font-sans text-[10px] text-slate-400 uppercase">
              Merchant Payer ID
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">{merchantId}</span>
              <button
                type="button"
                onClick={() => handleCopy(merchantId, 'merchantId')}
                className="p-0.5 text-slate-400 transition-colors hover:text-slate-700"
                title="Copy merchant ID"
              >
                {copiedKey === 'merchantId' ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-xs">
            <span className="block font-sans text-[10px] text-slate-400 uppercase">
              Settlement Currency
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-bold text-slate-900">
              <span className="rounded-md border border-emerald-200/60 bg-emerald-50 px-1.5 py-0.2 text-[11px] text-emerald-800">
                {currency}
              </span>
              <span className="font-sans text-slate-500 text-xs">· US Dollar Payouts</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (cr.request_type === 'CANCELLATION_POLICY') {
    const data = (payload.data as Record<string, unknown>) || {}
    const freeCancelHours = String(data.free_cancel_hours || '24')
    const noShowDisplay =
      data.no_show_fee_percent != null
        ? `${data.no_show_fee_percent}%`
        : data.no_show_fee != null
          ? `$${data.no_show_fee}`
          : '50%'
    const lateCancelDisplay =
      data.late_cancel_fee_percent != null ? `${data.late_cancel_fee_percent}%` : '25%'
    const holdPercent = String(data.hold_percent || '100')

    return (
      <div className="space-y-3 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-slate-50/40 p-4 text-slate-700 text-xs shadow-xs">
        <div className="flex items-center justify-between border-amber-100 border-b pb-2">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-800">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <span>Proposed Cancellation &amp; No-Show Policy Amendment</span>
          </div>
          <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold font-mono text-[10px] text-amber-900">
            Escrow Guarded
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 font-mono text-xs sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-xs">
            <span className="block font-sans text-[10px] text-slate-400 uppercase">
              Notice Window
            </span>
            <div className="mt-1 font-bold text-slate-900 text-sm tabular-nums tracking-tight">
              {freeCancelHours}
              <span className="ml-0.5 font-normal text-slate-500 text-xs">hrs</span>
            </div>
            <span className="mt-0.5 block font-sans text-[10px] text-slate-400">
              Free cancel cutoff
            </span>
          </div>

          <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-xs">
            <span className="block font-sans text-[10px] text-slate-400 uppercase">
              No-Show Penalty
            </span>
            <div className="mt-1 font-bold text-rose-800 text-sm tabular-nums tracking-tight">
              {noShowDisplay}
            </div>
            <span className="mt-0.5 block font-sans text-[10px] text-slate-400">
              Captured on missed slot
            </span>
          </div>

          <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-xs">
            <span className="block font-sans text-[10px] text-slate-400 uppercase">
              Late Cancel
            </span>
            <div className="mt-1 font-bold text-amber-900 text-sm tabular-nums tracking-tight">
              {lateCancelDisplay}
            </div>
            <span className="mt-0.5 block font-sans text-[10px] text-slate-400">
              Fee past notice cutoff
            </span>
          </div>

          <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-xs">
            <span className="block font-sans text-[10px] text-slate-400 uppercase">
              Authorization Hold
            </span>
            <div className="mt-1 font-bold text-emerald-800 text-sm tabular-nums tracking-tight">
              {holdPercent}%
            </div>
            <span className="mt-0.5 block font-sans text-[10px] text-slate-400">
              Zero-debit hold share
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <pre className="overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50 p-3 font-mono text-[11px] text-slate-600 shadow-xs">
      {JSON.stringify(cr.payload_json, null, 2)}
    </pre>
  )
}
