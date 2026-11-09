'use client'

import { Check, Percent, Receipt } from 'lucide-react'

import { formatUsd } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Booking } from '@/types'

export interface PolicyBreakdownCardProps {
  booking: Booking
  isSettled: boolean
  isCaptured: boolean
  isNoShowCaptured: boolean
  isVoided: boolean
  isRefunded: boolean
  calculatedCommission: number
  estimatedNetSalonRevenue: number
  salonRetentionPercent: string
  commissionRateLabel: string
  commissionTypeLabel: string
  baseGrossForCommission: number
}

export function PolicyBreakdownCard({
  booking,
  isSettled,
  isCaptured,
  isNoShowCaptured,
  isVoided,
  isRefunded,
  calculatedCommission,
  estimatedNetSalonRevenue,
  salonRetentionPercent,
  commissionRateLabel,
  commissionTypeLabel,
  baseGrossForCommission,
}: PolicyBreakdownCardProps) {
  return (
    <>
      {/* 1. Well-Formatted Financial Information & Receipt Breakdown Card */}
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 p-4 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Receipt className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Financial &amp; Receipt Breakdown
            </span>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border',
              isRefunded
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : isCaptured
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : isNoShowCaptured
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : isVoided
                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200',
            )}
          >
            <Check className="h-2.5 w-2.5" />
            {isRefunded && `Refund Issued (${formatUsd(booking.refundAmount ?? 0)})`}
            {!isRefunded && isCaptured && 'Settled in Full'}
            {!isRefunded && isNoShowCaptured && 'No-Show Fee Captured'}
            {!isRefunded && isVoided && 'Released · $0 Charged'}
            {!isRefunded && !isSettled && '$0 Charged Upfront'}
          </span>
        </div>

        {/* Price & Hold Highlights */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">Service Price</span>
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {formatUsd(booking.servicePrice)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Full appointment total</span>
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 shadow-2xs">
            <span className="text-[11px] font-medium text-amber-900 block mb-1">
              Reserved Deposit Hold
            </span>
            <div className="text-xl font-bold font-mono text-amber-900 tabular-nums">
              {formatUsd(booking.holdAmount)}
            </div>
            <span className="text-[10px] text-amber-700 mt-0.5 block">
              Locked PayPal pre-approval
            </span>
          </div>
        </div>

        {/* Itemized Receipt Line Items */}
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-slate-600">Client Charged at Booking</span>
            <span className="font-semibold text-emerald-700 font-mono">{formatUsd(0)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-700">
            <span className="text-slate-600">Agreed No-Show Fee</span>
            <span className="font-semibold text-rose-700 font-mono">
              {formatUsd(booking.noShowFee)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-700">
            <span className="text-slate-600">Late Cancellation Fee</span>
            <span className="font-semibold text-rose-700 font-mono">
              {formatUsd(booking.lateCancelFee)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-700">
            <span className="text-slate-600">Free Cancellation Until</span>
            <span className="font-medium text-slate-900">
              {booking.freeCancelDeadlineLabel || booking.authExpiresAt || 'Standard Policy'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-700 pt-1.5 border-t border-amber-200/60">
            <span className="text-slate-600">Platform Software Fee ({commissionRateLabel})</span>
            <span className="font-semibold text-slate-700 font-mono">
              {formatUsd(calculatedCommission)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-900 font-medium">
            <span className="text-slate-700 font-semibold">Est. Net Salon Revenue</span>
            <span className="font-bold text-emerald-800 font-mono">
              {formatUsd(estimatedNetSalonRevenue)}
            </span>
          </div>

          {booking.cancellationFeeCharged != null && booking.cancellationFeeCharged > 0 && (
            <div className="flex items-center justify-between text-rose-800 font-medium pt-1.5 border-t border-rose-200/60">
              <span>Cancellation Penalty Charged</span>
              <span className="font-mono font-bold">
                {formatUsd(booking.cancellationFeeCharged)}
              </span>
            </div>
          )}

          {isCaptured && (
            <div className="flex items-center justify-between text-emerald-800 font-medium pt-1.5 border-t border-emerald-200/60">
              <span>Captured to Merchant Account</span>
              <span className="font-mono font-bold">{formatUsd(booking.servicePrice)}</span>
            </div>
          )}

          {isNoShowCaptured && (
            <div className="flex items-center justify-between text-rose-800 font-medium pt-1.5 border-t border-rose-200/60">
              <span>No-Show Penalty Captured</span>
              <span className="font-mono font-bold">{formatUsd(booking.noShowFee)}</span>
            </div>
          )}

          {isVoided && (
            <div className="flex items-center justify-between text-slate-600 font-medium pt-1.5 border-t border-slate-200/60">
              <span>Final Charged Amount</span>
              <span className="font-mono font-bold text-slate-800">{formatUsd(0)}</span>
            </div>
          )}

          {isRefunded && (
            <div className="flex items-center justify-between text-purple-800 font-medium pt-1.5 border-t border-purple-200/60">
              <span className="flex items-center gap-1.5">
                <span>Refund Executed</span>
                {booking.refundId && (
                  <span className="font-mono text-[10px] text-purple-600">
                    ({booking.refundId})
                  </span>
                )}
              </span>
              <span className="font-mono font-bold text-purple-700">
                -{formatUsd(booking.refundAmount ?? 0)}
              </span>
            </div>
          )}
        </div>

        {/* Explainer Note */}
        <p className="text-[11px] text-amber-900/80 leading-relaxed bg-amber-100/40 rounded-xl p-2.5 border border-amber-200/50">
          <span className="font-semibold">Direct PayPal settlement:</span> Zero dollars debited
          upfront. Funds are pre-authorized on the client&apos;s card and captured directly into
          your salon&apos;s PayPal merchant account upon service completion or verified no-show.
        </p>
      </div>

      {/* 2. Platform Commission & Net Payout Card */}
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 p-4 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Percent className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Platform Commission &amp; Net Payout
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-800">
            {commissionRateLabel} Take-Rate
          </span>
        </div>

        {/* Net Salon vs Commission 2-col tiles */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3 shadow-2xs">
            <span className="text-[11px] font-medium text-emerald-900 block mb-1">
              Est. Net Salon Revenue
            </span>
            <div className="text-xl font-bold font-mono text-emerald-950 tabular-nums">
              {formatUsd(estimatedNetSalonRevenue)}
            </div>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">
              {salonRetentionPercent}% retention rate
            </span>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">
              Platform SaaS Fee
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {formatUsd(calculatedCommission)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Billed on periodic SaaS invoice
            </span>
          </div>
        </div>

        {/* Commission details rows */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-slate-500">Commission Rule</span>
            <span className="font-semibold text-slate-900">
              {commissionTypeLabel} ({commissionRateLabel})
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-700">
            <span className="text-slate-500">Gross Settlement Base</span>
            <span className="font-mono font-medium text-slate-800">
              {formatUsd(baseGrossForCommission)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-700">
            <span className="text-slate-500">Payout Model</span>
            <span className="font-medium text-emerald-700">100% Direct to Salon PayPal</span>
          </div>

          <div className="flex items-center justify-between text-slate-700">
            <span className="text-slate-500">Ledger Accrual Status</span>
            <span className="font-medium text-slate-800">
              {isSettled ? 'Accrued to Ledger' : 'Pending Capture'}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-indigo-950/80 leading-relaxed bg-indigo-100/40 rounded-xl p-2.5 border border-indigo-200/50">
          <span className="font-semibold">Transparent SaaS Billing:</span> 100% of the client&apos;s
          payment flows directly to your PayPal account. SalonDesk does not withhold commissions at
          checkout; fees accrue in your double-entry ledger and are billed via consolidated
          statements.
        </p>
      </div>
    </>
  )
}
