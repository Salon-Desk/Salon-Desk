'use client'

import { AlertTriangle, ShieldCheck } from 'lucide-react'
import React from 'react'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
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
    <CustomResponsiveDialog
      open={true}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      header={
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isFree ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
            <h3 className="font-bold text-base text-stone-900">
              {isFree ? 'Cancel for free?' : 'Late cancellation fee applies'}
            </h3>
          </div>
          <p className="text-stone-500 text-xs">
            {isFree
              ? 'You are still within the free-cancellation window. PayPal will release your hold with nothing charged.'
              : 'The free-cancellation deadline has passed. Cancelling now captures the late fee from your PayPal hold; the rest is released.'}
          </p>
        </div>
      }
      footer={
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row w-full sm:w-auto">
          <PrimaryButton
            variant="ghost"
            size="sm"
            className="h-10 cursor-pointer rounded-full px-4 text-xs sm:text-sm font-semibold transition-colors hover:bg-stone-100 text-stone-700"
            onClick={onClose}
            isDisabled={isSubmitting}
            title="Keep appointment"
            fullWidth={false}
          />
          <PrimaryButton
            variant={isFree ? 'dark' : 'danger'}
            size="sm"
            className="h-10 cursor-pointer rounded-full px-5 text-xs sm:text-sm font-semibold transition-all active:scale-[0.98]"
            onClick={onConfirm}
            isDisabled={isSubmitting}
            isLoading={isSubmitting}
            title={
              isSubmitting
                ? 'Cancelling…'
                : isFree
                  ? 'Confirm cancel ($0 charge)'
                  : `Confirm cancel (${formatUsd(preview.chargeAmount)} fee)`
            }
            fullWidth={false}
          />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm">
          <p className="font-medium text-stone-950">{booking.serviceName}</p>
          <p className="mt-0.5 text-stone-500 text-xs">
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
          <div className="mt-1 flex justify-between gap-3 border-stone-100 border-t pt-2">
            <dt className="font-medium text-stone-800">You pay if you cancel now</dt>
            <dd
              className={isFree ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-800'}
            >
              {formatUsd(preview.chargeAmount)}
            </dd>
          </div>
        </dl>
      </div>
    </CustomResponsiveDialog>
  )
}
