'use client'

import { CheckCircle2, Send, ShieldAlert, X } from 'lucide-react'
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
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!open || !booking) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error('Please enter the reason for your dispute', toastColor.error)
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
      toast.success(
        'Dispute submitted. Salon management and platform support have been notified.',
        toastColor.success,
      )
    }, 600)
  }

  const handleClose = () => {
    setSubmitted(false)
    setReason('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8 animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-900 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="font-serif text-2xl font-medium text-stone-950">Dispute Submitted</h3>
            <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
              Your explanation regarding booking{' '}
              <span className="font-mono font-semibold text-stone-700">
                {booking.id.slice(0, 8)}
              </span>{' '}
              has been recorded and routed to {booking.salonName || 'the salon'} and SalonDesk
              support. You will receive an update by email within 24 hours.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full bg-stone-950 px-6 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                  No-Show Recourse
                </span>
                <h3 className="font-serif text-xl font-medium text-stone-950">
                  Dispute No-Show Flag
                </h3>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-xs space-y-2 text-rose-950">
              <div className="flex justify-between items-center font-medium">
                <span>{booking.serviceName}</span>
                <span className="font-bold text-rose-700">
                  {formatUsd(booking.noShowFee)} fee charged
                </span>
              </div>
              <div className="text-[11px] text-rose-800 space-y-0.5">
                <p>Salon: {booking.salonName || 'Salon'}</p>
                <p>Scheduled: {booking.appointmentTime}</p>
                <p>Stylist: {booking.stylistName}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                  Why do you believe this was marked in error?{' '}
                  <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. I attended the appointment on time, or the salon rescheduled our session..."
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 p-3 text-xs text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-hidden"
                  required
                />
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5 text-xs text-stone-600 space-y-1">
                <p className="font-semibold text-stone-800">Direct Salon Recourse</p>
                <p className="text-[11px] leading-relaxed text-stone-500">
                  You can also contact the salon directly to request a quick void or credit. If the
                  salon confirms attendance or mutual rescheduling, holds and charges are reversed
                  automatically.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-3 w-3" />
                  <span>{isSubmitting ? 'Submitting…' : 'Submit Dispute'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
