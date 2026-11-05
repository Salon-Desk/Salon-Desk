'use client'

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import { toastColor } from '@/constant/toast-color'
import { formatBookingRef, formatUsd } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCompletePaymentHoldMutation, useGetBookingQuery } from '@/store/api/clientApi'
import type { PaymentHold } from '@/types/api-booking'

import { CheckoutHeader } from './CheckoutHeader'

function formatFriendlyDate(isoDate?: string | null): string {
  if (!isoDate) return ''
  try {
    const d = new Date(isoDate)
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

function formatFriendlyTime(isoDate?: string | null): string {
  if (!isoDate) return ''
  try {
    const d = new Date(isoDate)
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function PayPalReturnView() {
  const params = useSearchParams()
  const router = useRouter()
  const holdId = params.get('hold_id') ?? ''
  const token = params.get('token') ?? params.get('orderID') ?? ''
  const cancelled = params.get('paypal') === 'cancelled' || params.get('stub') === 'cancel'

  const [completeHold] = useCompletePaymentHoldMutation()
  const [completedHold, setCompletedHold] = useState<PaymentHold | null>(null)
  const [copiedRef, setCopiedRef] = useState(false)

  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>(cancelled ? 'error' : 'loading')
  const [message, setMessage] = useState(
    cancelled
      ? 'PayPal authorization was cancelled by the cardholder.'
      : 'Finalizing your PayPal hold…',
  )

  // Fetch verified booking details once hold is confirmed
  const { data: booking, isLoading: _isBookingLoading } = useGetBookingQuery(
    completedHold?.booking_id ?? '',
    {
      skip: !completedHold?.booking_id,
    },
  )

  useEffect(() => {
    if (cancelled || !holdId) {
      if (!holdId && !cancelled) {
        setStatus('error')
        setMessage('Missing hold reference from PayPal return.')
      }
      return
    }

    let isMounted = true

    void completeHold({
      holdId,
      body: { paypal_order_token: token || null },
    })
      .unwrap()
      .then((hold) => {
        if (!isMounted) return
        setCompletedHold(hold)
        setStatus('ok')
        setMessage('Hold authorized. Your appointment is confirmed — $0 charged today.')
      })
      .catch((err) => {
        if (!isMounted) return
        const errorMsg = String(
          (err as { data?: { detail?: string } })?.data?.detail ||
            'Could not complete PayPal authorization.',
        )

        // If the hold was already finalized (e.g. user refreshed or webhook completed first)
        if (
          errorMsg.toLowerCase().includes('already') ||
          errorMsg.toLowerCase().includes('completed') ||
          errorMsg.toLowerCase().includes('active')
        ) {
          setStatus('ok')
          setMessage('Hold authorized. Your appointment is confirmed — $0 charged today.')
        } else {
          setStatus('error')
          setMessage(errorMsg)
        }
      })

    return () => {
      isMounted = false
    }
  }, [cancelled, holdId, token, completeHold])

  const handleCopyRef = async (refText: string) => {
    try {
      await navigator.clipboard.writeText(refText)
      setCopiedRef(true)
      toast.success('Booking reference copied to clipboard!', toastColor.info)
      setTimeout(() => setCopiedRef(false), 2000)
    } catch {
      toast.error('Failed to copy reference', toastColor.error)
    }
  }

  const holdAmountNumber = Number(completedHold?.amount || booking?.agreed_hold_amount || 0)

  return (
    <div className="flex min-h-dvh flex-col bg-[#fbfbfa]">
      <CheckoutHeader onExit={() => router.push('/client')} />

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-9 shadow-[0_24px_48px_-24px_rgba(28,25,23,0.14)]">
          {/* Subtle ambient gradient aura according to status */}
          <div
            className={cn(
              'pointer-events-none absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full blur-3xl opacity-60',
              status === 'ok'
                ? 'bg-gradient-to-b from-emerald-200/50 via-teal-100/30 to-transparent'
                : status === 'loading'
                  ? 'bg-gradient-to-b from-amber-200/50 via-orange-100/30 to-transparent'
                  : 'bg-gradient-to-b from-rose-200/50 via-red-100/30 to-transparent',
            )}
          />

          {/* ─────────────────── STATE 1: LOADING ─────────────────── */}
          {status === 'loading' && (
            <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in duration-300">
              <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/90 text-amber-600 shadow-2xs">
                <Loader2 className="h-8 w-8 animate-spin" />
                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500">
                  <Lock className="h-2.5 w-2.5 text-white" />
                </div>
              </div>

              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50/80 px-3 py-1 font-medium text-amber-900 text-xs shadow-2xs">
                <Lock className="h-3 w-3 text-amber-600" />
                <span>PayPal Hold Verification · $0 Charged Today</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-stone-950 tracking-tight">
                Confirming your booking…
              </h1>

              <p className="mt-2 max-w-sm text-stone-500 text-xs sm:text-sm leading-relaxed">
                We are validating your cryptographic authorization with PayPal to secure your
                appointment slot on the salon calendar.
              </p>

              {/* Multi-step progress visualizer */}
              <div className="mt-6 w-full space-y-2 rounded-2xl border border-stone-100 bg-stone-50/80 p-3.5 text-left text-xs">
                <div className="flex items-center gap-2.5 text-stone-700">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="font-medium">Returned from PayPal authorization</span>
                </div>

                <div className="flex items-center gap-2.5 text-amber-800">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </div>
                  <span className="font-medium">Validating no-show protection hold</span>
                </div>

                <div className="flex items-center gap-2.5 text-stone-400">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-200/70 text-stone-500 text-[10px] font-bold">
                    3
                  </div>
                  <span>Locking in salon schedule slot</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => router.push('/client')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 transition-colors hover:text-stone-900 cursor-pointer py-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Return to salon services</span>
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────── STATE 2: SUCCESS ─────────────────── */}
          {status === 'ok' && (
            <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in duration-300">
              <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/70 border border-emerald-200 text-emerald-600 shadow-2xs">
                <CheckCircle2 className="h-8 w-8" />
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xs">
                  <Sparkles className="h-3 w-3" />
                </div>
              </div>

              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3.5 py-1 text-xs font-semibold text-emerald-900 shadow-2xs">
                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                <span>Held {formatUsd(holdAmountNumber)} · $0.00 Charged Today</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-950 tracking-tight">
                You are booked!
              </h1>

              <p className="mt-1.5 max-w-sm text-stone-500 text-xs sm:text-sm leading-relaxed">
                Your appointment slot is locked in. A calendar invitation and confirmation receipt
                have been registered.
              </p>

              {/* Appointment & Hold Card */}
              <div className="mt-6 w-full space-y-3 rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4 sm:p-5 text-left text-xs">
                {/* Service & Salon title */}
                <div className="border-b border-stone-200/60 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 leading-snug">
                        {booking?.service_name || 'Confirmed Salon Service'}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1.5 text-stone-500 text-xs">
                        <Store className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span>{booking?.organization_name || 'Salon Desk Salon'}</span>
                      </p>
                    </div>

                    {booking?.id && (
                      <button
                        type="button"
                        onClick={() => handleCopyRef(formatBookingRef(booking.id))}
                        className="group inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 font-mono text-[10px] font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
                        title="Copy booking reference"
                      >
                        <span>Ref {formatBookingRef(booking.id)}</span>
                        {copiedRef ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-stone-400 group-hover:text-stone-600" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Details grid: Time & Stylist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-center gap-2 rounded-xl bg-white/90 border border-stone-200/60 p-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block">
                        Date &amp; Time
                      </span>
                      <span className="font-medium text-stone-900 text-xs truncate block">
                        {booking?.starts_at
                          ? `${formatFriendlyDate(booking.starts_at)} · ${formatFriendlyTime(booking.starts_at)}`
                          : 'Appointment Slot Reserved'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl bg-white/90 border border-stone-200/60 p-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block">
                        Stylist
                      </span>
                      <span className="font-medium text-stone-900 text-xs truncate block">
                        {booking?.stylist_name || 'Assigned Specialist'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hold verification footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/60 text-[11px] text-stone-500 font-mono">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold font-sans">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Cryptographic Hold Active</span>
                  </span>
                  {completedHold?.paypal_order_id && (
                    <span className="text-stone-400 truncate max-w-[180px]">
                      PayPal {completedHold.paypal_order_id}
                    </span>
                  )}
                </div>
              </div>

              {/* Zero-Risk Guarantee Callout */}
              <div className="mt-4 w-full rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-3 sm:p-3.5 text-left text-xs text-emerald-950">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-emerald-900">Zero Charge Today Guarantee</p>
                    <p className="text-emerald-800/90 text-[11px] leading-relaxed">
                      No money leaves your card today. You pay in full at the salon upon completion.
                      Free cancellation is available anytime before the salon deadline.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2.5 w-full">
                <PrimaryButton
                  variant="dark"
                  size="sm"
                  fullWidth="full"
                  className="h-12 w-full cursor-pointer rounded-full text-sm font-semibold transition-all hover:bg-stone-800 active:scale-[0.99] shadow-sm justify-center"
                  title="View my bookings"
                  icon={<ArrowRight className="h-4 w-4 ml-1" />}
                  onClick={() => router.push('/client/bookings')}
                />

                <PrimaryButton
                  variant="secondary"
                  size="sm"
                  fullWidth="full"
                  className="h-11 w-full cursor-pointer rounded-full border border-stone-200 bg-stone-100 text-xs sm:text-sm font-semibold text-stone-800 transition-all hover:bg-stone-200 active:scale-[0.99] justify-center"
                  title="Continue browsing salon services"
                  onClick={() => router.push('/client')}
                />
              </div>
            </div>
          )}

          {/* ─────────────────── STATE 3: ERROR / CANCELLED ─────────────────── */}
          {status === 'error' && (
            <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in duration-300">
              <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 shadow-2xs">
                <XCircle className="h-8 w-8" />
              </div>

              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 shadow-2xs">
                <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                <span>{cancelled ? 'Authorization Cancelled' : 'Hold Incomplete'}</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-stone-950 tracking-tight">
                {cancelled ? 'PayPal hold cancelled' : 'Hold could not be completed'}
              </h1>

              <p className="mt-1.5 max-w-sm text-stone-500 text-xs sm:text-sm leading-relaxed">
                Don&apos;t worry — no funds were deducted from your card or PayPal account.
              </p>

              {/* Friendly explanation card */}
              <div className="mt-5 w-full rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4 text-left text-xs space-y-2">
                <p className="text-stone-700 leading-relaxed">
                  {cancelled
                    ? 'You cancelled the PayPal hold authorization before confirming your appointment. Your appointment slot has been released back to the salon schedule.'
                    : 'We were unable to complete the PayPal hold authorization. This may be due to an expired session or network interruption.'}
                </p>

                {message && !cancelled && (
                  <div className="rounded-lg bg-rose-50/80 border border-rose-100 p-2 font-mono text-[11px] text-rose-800 break-words">
                    {message}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2.5 w-full">
                <PrimaryButton
                  variant="dark"
                  size="sm"
                  fullWidth="full"
                  className="h-12 w-full cursor-pointer rounded-full text-sm font-semibold transition-all hover:bg-stone-800 active:scale-[0.99] shadow-sm justify-center"
                  title="Return to services &amp; try again"
                  onClick={() => router.push('/client')}
                />

                <Link
                  href="/client"
                  className="text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors py-1 inline-flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Explore available salon catalog</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
