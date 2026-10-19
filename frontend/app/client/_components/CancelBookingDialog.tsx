'use client'

import { AlertTriangle, ShieldCheck } from 'lucide-react'

import { Button, Modal } from '@/components/ui'
import type { CancelOutcomePreview } from '@/lib/booking/cancel-policy'
import { formatUsd } from '@/lib/format'
import type { Booking } from '@/types'

interface CancelBookingDialogProps {
  booking: Booking
  preview: CancelOutcomePreview
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function CancelBookingDialog({
  booking,
  preview,
  isSubmitting = false,
  onClose,
  onConfirm,
}: CancelBookingDialogProps) {
  const isFree = preview.withinFreeWindow

  return (
    <Modal
      onClose={onClose}
      size="md"
      icon={
        isFree ? (
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        )
      }
      title={isFree ? 'Cancel for free?' : 'Late cancellation fee applies'}
      description={
        isFree
          ? 'You are still within the free-cancellation window. PayPal will release your hold with nothing charged.'
          : 'The free-cancellation deadline has passed. Cancelling now captures the late fee from your PayPal hold; the rest is released.'
      }
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Keep appointment
          </Button>
          <Button
            variant={isFree ? 'dark' : 'danger'}
            className="rounded-full"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Cancelling…'
              : isFree
                ? 'Confirm cancel ($0 charge)'
                : `Confirm cancel (${formatUsd(preview.chargeAmount)} fee)`}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm">
          <p className="font-medium text-stone-950">{booking.serviceName}</p>
          <p className="mt-0.5 text-xs text-stone-500">
            {booking.appointmentTime}
            {booking.salonName ? ` · ${booking.salonName}` : ''}
          </p>
        </div>

        <dl className="grid gap-2 rounded-2xl border border-stone-200 px-4 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-stone-500">Free cancel until</dt>
            <dd className="font-medium text-stone-900">{preview.freeCancelDeadlineLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-stone-500">Late cancellation fee</dt>
            <dd className="font-medium text-stone-900">
              {formatUsd(preview.lateCancelFee)}{' '}
              <span className="font-normal text-stone-500">({preview.lateCancelPct}%)</span>
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-stone-500">No-show fee (if you miss visit)</dt>
            <dd className="font-medium text-stone-900">
              {formatUsd(preview.noShowFee)}{' '}
              <span className="font-normal text-stone-500">({preview.noShowPct}%)</span>
            </dd>
          </div>
          <div className="mt-1 flex justify-between gap-3 border-t border-stone-100 pt-2">
            <dt className="font-medium text-stone-800">You pay if you cancel now</dt>
            <dd
              className={isFree ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-800'}
            >
              {formatUsd(preview.chargeAmount)}
            </dd>
          </div>
        </dl>

        {!isFree ? (
          <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900">
            SalonDesk captures only the locked late-cancellation fee (
            {formatUsd(preview.lateCancelFee)}
            ), not the full service price or the no-show fee. Platform commission is calculated on
            the captured amount only.
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
