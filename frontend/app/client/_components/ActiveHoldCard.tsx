import { AlertTriangle, Clock, FileText, Lock, Shield, User, XCircle } from 'lucide-react'
import Image from 'next/image'

import { buildCancelOutcomePreview } from '@/lib/booking/cancel-policy'
import { formatBookingRef, formatUsd } from '@/lib/format'
import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'
import type { Booking } from '@/types'

interface ActiveHoldCardProps {
  booking: Booking
  onCancel: () => void
  onViewReceipt: (booking: Booking) => void
}

export function ActiveHoldCard({ booking, onCancel, onViewReceipt }: ActiveHoldCardProps) {
  const cancelPreview = buildCancelOutcomePreview({
    totalPrice: booking.servicePrice,
    agreedNoShowFee: booking.noShowFee,
    agreedLateCancelFee: booking.lateCancelFee,
    freeCancelDeadlineAt: booking.freeCancelDeadlineAt ?? booking.authExpiresAt,
    policySnapshot: booking.policySnapshot,
  })

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-stone-200/60 bg-white p-4 transition-all hover:border-stone-300 sm:p-7">
      <div>
        {/* Top Badges & Service */}
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] font-semibold tracking-widest text-amber-700 uppercase">
              {formatBookingRef(booking.id)}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
              <Lock className="h-3 w-3 text-amber-600" />
              <span>Held {formatUsd(booking.holdAmount)}</span>
            </span>
          </div>
          <h3 className="font-serif text-xl font-normal text-stone-950 sm:text-2xl">
            {booking.serviceName}
          </h3>
          {booking.salonName ? (
            <p className="truncate text-xs text-stone-500">{booking.salonName}</p>
          ) : null}
        </div>

        {/* Metadata Grid */}
        <div className="mb-5 grid grid-cols-2 gap-x-3 gap-y-3.5 rounded-2xl bg-stone-50/80 p-3.5 text-xs sm:p-4">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Stylist
            </span>
            <div className="flex items-center gap-1.5 font-medium text-stone-900">
              {booking.stylistPicture ? (
                <Image
                  src={booking.stylistPicture}
                  alt=""
                  width={20}
                  height={20}
                  unoptimized={shouldUnoptimizedImage(booking.stylistPicture)}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <User className="h-3.5 w-3.5 text-stone-500" />
              )}
              <span>{booking.stylistName}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Appointment
            </span>
            <div className="flex items-center gap-1.5 font-medium text-stone-900">
              <Clock className="h-3.5 w-3.5 text-stone-500" />
              <span>{booking.appointmentTime}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Service total
            </span>
            <div className="font-semibold text-stone-900">{formatUsd(booking.servicePrice)}</div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Cancellation
            </span>
            <div
              className={
                cancelPreview.withinFreeWindow
                  ? 'font-medium text-emerald-700'
                  : 'font-medium text-amber-800'
              }
            >
              {cancelPreview.withinFreeWindow
                ? `Free until ${booking.freeCancelDeadlineLabel || booking.authExpiresAt}`
                : `Late fee ${formatUsd(cancelPreview.lateCancelFee)} if you cancel now`}
            </div>
          </div>
        </div>

        {!cancelPreview.withinFreeWindow ? (
          <div className="mb-5 flex gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-3.5 py-3 text-xs leading-relaxed text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              The free-cancellation window ended on{' '}
              <span className="font-semibold">{cancelPreview.freeCancelDeadlineLabel}</span>.
              Cancelling now captures{' '}
              <span className="font-semibold">{formatUsd(cancelPreview.lateCancelFee)}</span> (
              {cancelPreview.lateCancelPct}% of {formatUsd(booking.servicePrice)}) from your PayPal
              hold. Missing the visit without cancelling may incur the no-show fee of{' '}
              {formatUsd(cancelPreview.noShowFee)}.
            </p>
          </div>
        ) : (
          <p className="mb-5 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-900">
            Cancel before {cancelPreview.freeCancelDeadlineLabel} to release your hold at{' '}
            {formatUsd(0)}.
          </p>
        )}

        {booking.customerNotes ? (
          <p className="mb-5 flex items-start gap-2 rounded-xl bg-stone-50 px-3.5 py-2.5 text-xs text-stone-600">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
            <span>{booking.customerNotes}</span>
          </p>
        ) : null}

        {booking.consentHash && booking.consentHash !== '—' ? (
          <div className="mb-6 flex items-center justify-between rounded-xl bg-stone-100/60 px-3.5 py-2 text-[11px] text-stone-500 font-mono">
            <div className="flex min-w-0 items-center gap-1.5 truncate">
              <Shield className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span className="truncate">{booking.consentHash}</span>
            </div>
            <span className="text-stone-400 font-medium">PayPal v6</span>
          </div>
        ) : null}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2.5 pt-4 border-t border-stone-100">
        <button
          type="button"
          onClick={() => onViewReceipt(booking)}
          className="h-10 flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-semibold px-4 transition-colors cursor-pointer active:scale-[0.98]"
        >
          <FileText className="h-3.5 w-3.5 text-stone-600" />
          <span>View Receipt</span>
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="h-10 flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold px-4 transition-colors cursor-pointer active:scale-[0.98]"
        >
          <XCircle className="h-3.5 w-3.5 text-rose-600" />
          {cancelPreview.withinFreeWindow ? (
            <>
              <span className="sm:hidden">Cancel ($0)</span>
              <span className="hidden sm:inline">Cancel & release hold ($0)</span>
            </>
          ) : (
            <>
              <span className="sm:hidden">Cancel ({formatUsd(cancelPreview.chargeAmount)})</span>
              <span className="hidden sm:inline">
                Cancel ({formatUsd(cancelPreview.chargeAmount)} late fee)
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
