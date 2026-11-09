'use client'

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Copy,
  CreditCard,
  Info,
  Lock,
  Scale,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { formatBookingRef, formatUsd, isPlaceholderValue } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Booking } from '@/types'

export interface TechnicalDetailsAccordionProps {
  booking: Booking
  isCaptured: boolean
  isNoShowCaptured: boolean
  isVoided: boolean
  isSettled: boolean
  copiedKey: string | null
  onCopy: (text: string, key: string) => void
  showTechnicalDetails: boolean
  onToggleTechnicalDetails: () => void
  onClose: () => void
}

export function TechnicalDetailsAccordion({
  booking,
  isCaptured,
  isNoShowCaptured,
  isVoided,
  isSettled,
  copiedKey,
  onCopy,
  showTechnicalDetails,
  onToggleTechnicalDetails,
  onClose,
}: TechnicalDetailsAccordionProps) {
  const router = useRouter()

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Payment Reference &amp; Guarantee
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
          <Lock className="h-2.5 w-2.5 text-slate-500" />
          Protected
        </span>
      </div>

      {/* Friendly Non-Technical Guarantee Banner */}
      <div
        className={cn(
          'flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed',
          isCaptured
            ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
            : isNoShowCaptured
              ? 'border-amber-200 bg-amber-50/70 text-amber-950'
              : isVoided
                ? 'border-slate-200 bg-slate-50 text-slate-800'
                : 'border-sky-200 bg-sky-50/70 text-sky-950',
        )}
      >
        {isCaptured ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
        ) : isNoShowCaptured ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        ) : isVoided ? (
          <XCircle className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
        ) : (
          <ShieldCheck className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-bold text-xs">
            {isCaptured && 'Payment Captured & Deposited'}
            {isNoShowCaptured && 'No-Show Fee Captured & Deposited'}
            {isVoided && 'Appointment Cancelled — Payment Hold Released'}
            {!isSettled && 'Pre-Authorized Payment Guarantee Active'}
          </div>
          <div className="text-[11px] opacity-85 mt-0.5">
            {isCaptured &&
              `Full payment of ${formatUsd(booking.servicePrice)} has been deposited into your salon's PayPal merchant account.`}
            {isNoShowCaptured &&
              `Agreed no-show fee of ${formatUsd(booking.noShowFee)} has been captured and deposited into your PayPal account.`}
            {isVoided &&
              'The reservation was cancelled and the authorization hold was released with $0 charged.'}
            {!isSettled &&
              `A deposit of ${formatUsd(booking.holdAmount)} is locked on the client's PayPal payment method, ensuring guaranteed payment when service completes.`}
          </div>
        </div>
      </div>

      {/* Dispute Counsel Link */}
      {isNoShowCaptured && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-200/80 bg-indigo-50/60 p-3 text-xs text-indigo-950">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
              <Scale className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs text-slate-900 truncate">Dispute Counsel Defense</p>
              <p className="text-[11px] text-slate-500 truncate">
                Review cryptographic evidence dossier &amp; PayPal dispute status
              </p>
            </div>
          </div>
          <button
            type="button"
            id="agent-dispute-btn"
            onClick={() => {
              onClose()
              router.push('/merchant/disputes')
            }}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer shrink-0 ml-2"
          >
            View in Disputes →
          </button>
        </div>
      )}

      {/* Human-Readable Reference Details */}
      <div className="space-y-2.5 text-xs divide-y divide-slate-100">
        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-500">Payment Method</span>
          <span className="font-medium text-slate-800 flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-slate-400" />
            PayPal (Zero-Charge Authorization Hold)
          </span>
        </div>

        <div className="flex items-center justify-between pt-2.5">
          <span className="text-slate-500">PayPal Reference #</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold text-slate-900">
              {!isPlaceholderValue(booking.paypalAuthId)
                ? booking.paypalAuthId
                : booking.paypalOrderId && !isPlaceholderValue(booking.paypalOrderId)
                  ? booking.paypalOrderId
                  : `SD-AUTH-${formatBookingRef(booking.id)}`}
            </span>
            <button
              type="button"
              onClick={() =>
                onCopy(
                  !isPlaceholderValue(booking.paypalAuthId)
                    ? booking.paypalAuthId
                    : booking.paypalOrderId || `SD-AUTH-${formatBookingRef(booking.id)}`,
                  'paypal_ref',
                )
              }
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Copy PayPal Reference"
            >
              {copiedKey === 'paypal_ref' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {booking.refundId ? (
          <div className="flex items-center justify-between pt-2.5">
            <span className="text-slate-500">PayPal Refund ID</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-semibold text-purple-700">
                {booking.refundId}
              </span>
              <button
                type="button"
                onClick={() => onCopy(booking.refundId!, 'paypal_refund')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Copy PayPal Refund Reference"
              >
                {copiedKey === 'paypal_refund' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-2.5">
          <span className="text-slate-500">Booking Confirmation Ref</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold text-slate-900">
              SD-{formatBookingRef(booking.id)}
            </span>
            <button
              type="button"
              onClick={() => onCopy(`SD-${formatBookingRef(booking.id)}`, 'booking_ref')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Copy Booking Confirmation Ref"
            >
              {copiedKey === 'booking_ref' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5">
          <span className="text-slate-500">Client Terms Agreement</span>
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700 text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Digitally Agreed at Checkout
          </span>
        </div>

        <div className="flex items-center justify-between pt-2.5">
          <span className="text-slate-500">Protection Window</span>
          <span className="font-medium text-slate-800 text-[11px]">
            {booking.honorExpiresLabel || 'Standard 72-Hour PayPal Guarantee'}
          </span>
        </div>
      </div>

      {/* Collapsible Technical Identifiers */}
      <div className="pt-1.5 border-t border-slate-100">
        <button
          type="button"
          onClick={onToggleTechnicalDetails}
          className="w-full flex items-center justify-between py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Info className="h-3 w-3 text-slate-400" />
            Technical &amp; Audit Codes (For Support)
          </span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-slate-400 transition-transform duration-200',
              showTechnicalDetails && 'rotate-180',
            )}
          />
        </button>

        {showTechnicalDetails && (
          <div className="mt-2 rounded-xl bg-slate-50/80 p-3 space-y-2 font-mono text-[10px] text-slate-600 border border-slate-200/60 animate-in fade-in duration-150">
            <p className="font-sans text-[10px] text-slate-500 leading-relaxed mb-2">
              Use these technical codes if contacting PayPal Merchant Support or SalonDesk dispute
              operations.
            </p>

            <div className="flex items-center justify-between">
              <span className="font-sans text-slate-500">Payment Reference Key:</span>
              <span className="text-slate-700 truncate max-w-[170px]">
                {booking.idempotencyKey || 'ACTIVE'}
              </span>
            </div>

            {booking.consentHash && !isPlaceholderValue(booking.consentHash) && (
              <div className="flex items-center justify-between">
                <span className="font-sans text-slate-500">Terms Signature Hash:</span>
                <span className="text-slate-600 truncate max-w-[170px]">{booking.consentHash}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
