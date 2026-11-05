'use client'

import { Check, Copy, ExternalLink, HelpCircle, ShieldAlert, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { toastColor } from '@/constant/toast-color'
import { formatUsd } from '@/lib/format'
import type { Booking } from '@/types'

export interface DisputeBookingModalProps {
  booking: Booking | null
  open: boolean
  onClose: () => void
}

export function DisputeBookingModal({ booking, open, onClose }: DisputeBookingModalProps) {
  const [copiedId, setCopiedId] = useState(false)
  const [copiedText, setCopiedText] = useState(false)

  if (!open || !booking) return null

  const referenceId = booking.paypalAuthId || booking.id
  const feeAmount = formatUsd(booking.noShowFee || 25.0)
  const explanationTemplate = `I was charged a ${feeAmount} no-show fee for an appointment (${booking.serviceName}) at ${booking.salonName || 'the salon'} scheduled for ${booking.appointmentTime}. However, I did not receive the service. Please refund the deposit hold.`

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(referenceId)
      setCopiedId(true)
      toast.success('Transaction reference copied!', toastColor.success)
      setTimeout(() => setCopiedId(false), 2000)
    } catch {
      toast.error('Failed to copy', toastColor.error)
    }
  }

  const handleCopyExplanation = async () => {
    try {
      await navigator.clipboard.writeText(explanationTemplate)
      setCopiedText(true)
      toast.success('Explanation message copied to clipboard!', toastColor.success)
      setTimeout(() => setCopiedText(false), 2000)
    } catch {
      toast.error('Failed to copy', toastColor.error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8 animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Payment Protection
              </span>
              <h3 className="font-serif text-xl font-medium text-stone-950">
                Dispute Charge via PayPal
              </h3>
            </div>
          </div>

          {/* Fee & Booking Summary */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-xs space-y-2 text-rose-950">
            <div className="flex justify-between items-center font-medium">
              <span className="font-semibold text-rose-900">{booking.serviceName}</span>
              <span className="font-bold text-rose-700">{feeAmount} fee charged</span>
            </div>
            <div className="text-[11px] text-rose-800 space-y-0.5">
              <p>Salon: {booking.salonName || 'Salon'}</p>
              <p>Scheduled: {booking.appointmentTime}</p>
              <p>Stylist: {booking.stylistName}</p>
            </div>
          </div>

          {/* Direct PayPal Explanation */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 text-xs text-stone-700 space-y-2.5">
            <div className="flex items-center gap-1.5 font-semibold text-stone-900 text-xs">
              <HelpCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>How dispute refunds work</span>
            </div>
            <p className="text-[11px] leading-relaxed text-stone-600">
              SalonDesk does not hold your money directly. Deposit holds and charges are securely
              managed by <strong>PayPal</strong> and protected under{' '}
              <strong>PayPal Buyer Protection</strong>. To dispute this charge and request an
              official refund, file a report directly in your PayPal Resolution Center.
            </p>
          </div>

          {/* Helper Copy Items */}
          <div className="space-y-2.5 text-xs">
            {/* Item 1: Reference ID */}
            <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-2.5 shadow-2xs">
              <div className="min-w-0 flex-1 pr-2">
                <span className="block text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                  PayPal Reference ID
                </span>
                <span className="font-mono text-xs font-semibold text-stone-800 truncate block">
                  {referenceId}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
              >
                {copiedId ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-stone-500" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>

            {/* Item 2: Ready Explanation Text */}
            <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                  Recommended Reason &amp; Message
                </span>
                <button
                  type="button"
                  onClick={handleCopyExplanation}
                  className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-stone-500" />
                      <span>Copy Note</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-stone-600 bg-stone-50 rounded-lg p-2 font-sans italic border border-stone-100">
                &ldquo;{explanationTemplate}&rdquo;
              </p>
              <p className="text-[10px] text-stone-400">
                Select <strong>&ldquo;I haven&rsquo;t received the item or service&rdquo;</strong>{' '}
                in PayPal, then paste the text above.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto rounded-full border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer text-center"
            >
              Close
            </button>

            <a
              href="https://www.sandbox.paypal.com/resolutioncenter"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer"
            >
              <span>Open PayPal Resolution Center</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
