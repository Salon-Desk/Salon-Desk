'use client'

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Percent,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

import { toastColor } from '@/constant/toast-color'
import type { ApiChangeRequest } from '@/types/api-org'

export function getChangeRequestPlainSummary(cr: ApiChangeRequest): string {
  const payload = (cr.payload_json as Record<string, unknown>) || {}

  if (cr.request_type === 'PAYPAL_ACCOUNT') {
    const merchantId = String(payload.merchant_id || '—')
    const currency = String(payload.currency || 'USD')
    return `PayPal payouts to ${merchantId} in ${currency}`
  }

  if (cr.request_type === 'CANCELLATION_POLICY') {
    const data = (payload.data as Record<string, unknown>) || {}
    const hours = data.free_cancel_hours ?? '24'
    const noShow =
      data.no_show_fee_percent != null
        ? `${data.no_show_fee_percent}%`
        : data.no_show_fee != null
          ? `$${data.no_show_fee}`
          : '50%'
    const late = data.late_cancel_fee_percent != null ? `${data.late_cancel_fee_percent}%` : '25%'
    const hold = data.hold_percent ?? '100'
    return `Free cancel: ${hours}h · No-show: ${noShow} · Late: ${late} · Hold: ${hold}%`
  }

  return 'Custom policy or configuration amendment'
}

export function PayloadParameterCard({ cr }: { cr: ApiChangeRequest }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showRawJson, setShowRawJson] = useState(false)
  const payload = (cr.payload_json as Record<string, unknown>) || {}

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
      <div className="space-y-3.5 rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/70 via-white to-slate-50/40 p-4 text-slate-700 text-xs shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-sky-100 border-b pb-2.5">
          <div className="flex items-center gap-2 font-bold text-sky-950 text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <CreditCard className="h-4 w-4" />
            </div>
            <span>PayPal Merchant Payout Destination</span>
          </div>
          <span className="rounded-full bg-sky-100 px-2.5 py-0.5 font-bold font-mono text-[10px] text-sky-800">
            Orders v2 Direct Escrow
          </span>
        </div>

        {/* Plain Language Explanation */}
        <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-sky-950 text-xs leading-relaxed">
          <p className="font-medium">
            <strong>Plain Language Summary:</strong> The salon requests to route all customer
            booking deposits and completed appointment settlements to PayPal merchant account{' '}
            <strong className="font-mono">{merchantId}</strong>. Payouts will be processed in{' '}
            <strong>{currency} (US Dollars)</strong> with platform service fees deducted
            automatically.
          </p>
        </div>

        {/* Structured Parameter Cards */}
        <div className="grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
            <span className="block font-sans text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Merchant Payer ID
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">{merchantId}</span>
              <button
                type="button"
                onClick={() => handleCopy(merchantId, 'merchantId')}
                className="cursor-pointer p-1 text-slate-400 transition-colors hover:text-slate-700 rounded-md hover:bg-slate-100"
                title="Copy merchant ID"
              >
                {copiedKey === 'merchantId' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <span className="mt-1 block font-sans text-[11px] text-slate-500">
              Verified merchant identifier on PayPal
            </span>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
            <span className="block font-sans text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Settlement Currency
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <span className="rounded-md border border-emerald-200/60 bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-800">
                {currency}
              </span>
              <span className="font-sans text-slate-600">· US Dollar Payouts</span>
            </div>
            <span className="mt-1 block font-sans text-[11px] text-slate-500">
              Settlement currency for salon disbursements
            </span>
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
      <div className="space-y-3.5 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-slate-50/40 p-4 text-slate-700 text-xs shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-amber-100 border-b pb-2.5">
          <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span>Cancellation, Late Fee &amp; No-Show Policy</span>
          </div>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-bold font-mono text-[10px] text-amber-900">
            Escrow Guarded
          </span>
        </div>

        {/* Plain Language Narrative Box */}
        <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 text-amber-950 text-xs leading-relaxed space-y-1.5">
          <p className="font-semibold text-amber-900">Plain Language Policy Rules for Reviewers:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
            <li>
              <strong>Free Cancellation:</strong> Customers can cancel free of penalty up to{' '}
              <strong className="text-slate-900">{freeCancelHours} hours</strong> before their
              appointment.
            </li>
            <li>
              <strong>Late Cancellation:</strong> Cancellations made inside the {freeCancelHours}
              -hour window incur a <strong className="text-slate-900">
                {lateCancelDisplay}
              </strong>{' '}
              fee.
            </li>
            <li>
              <strong>No-Show Penalty:</strong> If a customer fails to attend without cancelling, a{' '}
              <strong className="text-slate-900">{noShowDisplay}</strong> penalty fee is captured.
            </li>
            <li>
              <strong>Checkout Authorization Hold:</strong> A temporary pre-authorization of{' '}
              <strong className="text-slate-900">{holdPercent}%</strong> of the service total is
              held at booking time.
            </li>
          </ul>
        </div>

        {/* 4 Quick Metric Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-sans text-[10px] font-semibold uppercase tracking-wider">
                Free Cancel
              </span>
            </div>
            <div className="mt-1 font-bold text-slate-900 text-base font-mono tabular-nums">
              {freeCancelHours}
              <span className="ml-0.5 font-sans font-normal text-slate-500 text-xs">hours</span>
            </div>
            <span className="mt-0.5 block text-[11px] text-slate-500">Prior to start time</span>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-1.5 text-rose-500">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span className="font-sans text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                No-Show
              </span>
            </div>
            <div className="mt-1 font-bold text-rose-700 text-base font-mono tabular-nums">
              {noShowDisplay}
            </div>
            <span className="mt-0.5 block text-[11px] text-slate-500">Missed appointment</span>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-1.5 text-amber-500">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="font-sans text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Late Cancel
              </span>
            </div>
            <div className="mt-1 font-bold text-amber-800 text-base font-mono tabular-nums">
              {lateCancelDisplay}
            </div>
            <span className="mt-0.5 block text-[11px] text-slate-500">
              Within {freeCancelHours}h notice
            </span>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-1.5 text-emerald-500">
              <Percent className="h-3.5 w-3.5" />
              <span className="font-sans text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Hold Share
              </span>
            </div>
            <div className="mt-1 font-bold text-emerald-700 text-base font-mono tabular-nums">
              {holdPercent}%
            </div>
            <span className="mt-0.5 block text-[11px] text-slate-500">Zero-debit PayPal hold</span>
          </div>
        </div>
      </div>
    )
  }

  // Fallback for custom or novel request types
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <FileText className="h-4 w-4 text-slate-500" />
          <span>Request Payload Parameters</span>
        </div>
        <button
          type="button"
          onClick={() => setShowRawJson(!showRawJson)}
          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
        >
          <span>{showRawJson ? 'Hide raw JSON' : 'Show raw JSON'}</span>
          {showRawJson ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {Object.entries(payload).map(([key, val]) => (
          <div key={key} className="rounded-xl border border-slate-200/80 bg-white p-2.5">
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {key.replace(/_/g, ' ')}
            </span>
            <span className="mt-1 block font-mono text-xs font-bold text-slate-900 truncate">
              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
            </span>
          </div>
        ))}
      </div>

      {showRawJson && (
        <pre className="mt-2 overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-3 font-mono text-[11px] text-slate-600 shadow-2xs">
          {JSON.stringify(cr.payload_json, null, 2)}
        </pre>
      )}
    </div>
  )
}
