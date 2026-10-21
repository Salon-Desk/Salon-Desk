'use client'

import { Calendar, Clock, FileText, Lock, Store, User } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { HoldStateBadge } from '@/components/ui'
import { formatBookingRef, formatDuration, formatUsd, isPlaceholderValue } from '@/lib/format'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import type { Booking } from '@/types'

import { ReceiptRow } from './ReceiptRow'

interface ReceiptModalProps {
  booking: Booking
  onClose: () => void
}

export function BookingReceipt({ booking, onClose }: ReceiptModalProps) {
  const salonLine = [booking.salonName, formatBookingRef(booking.id)].filter(Boolean).join(' · ')

  return (
    <CustomResponsiveDialog
      open={true}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      header={
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            <h3 className="font-bold text-base text-stone-900">{booking.serviceName}</h3>
          </div>
          {salonLine && <p className="text-stone-500 text-xs">{salonLine}</p>}
        </div>
      }
      footer={
        <PrimaryButton
          variant="dark"
          onClick={onClose}
          className="w-full rounded-full h-11 text-xs sm:text-sm font-medium"
          title="Close receipt"
          fullWidth
        />
      }
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {booking.stylistPicture ? (
            <Image
              src={booking.stylistPicture}
              alt=""
              width={44}
              height={44}
              unoptimized={shouldUnoptimizeImage(booking.stylistPicture)}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-stone-500">
              <User className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-[10px] text-stone-400 uppercase tracking-wider">
              Stylist
            </p>
            <p className="truncate font-medium text-stone-950">{booking.stylistName}</p>
          </div>
        </div>
        <HoldStateBadge status={booking.status} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl bg-stone-50/90 p-4">
        <ReceiptRow icon={Calendar} label="Appointment" value={booking.appointmentTime} />
        <ReceiptRow icon={Clock} label="Duration" value={formatDuration(booking.durationMin)} />
        <ReceiptRow icon={Store} label="Salon" value={booking.salonName} />
        <ReceiptRow icon={Lock} label="Service total" value={formatUsd(booking.servicePrice)} />
      </div>

      {booking.customerNotes ? (
        <p className="mb-5 flex items-start gap-2 rounded-xl bg-stone-50 px-3.5 py-2.5 text-stone-600 text-xs">
          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
          <span>{booking.customerNotes}</span>
        </p>
      ) : null}

      <div className="mb-5 rounded-2xl border border-amber-200/70 bg-amber-50/70 px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-amber-900">Held today</span>
          <span className="font-semibold text-amber-900">{formatUsd(booking.holdAmount)}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3 text-sm">
          <span className="text-amber-900">Late cancellation fee</span>
          <span className="font-semibold text-amber-900">{formatUsd(booking.lateCancelFee)}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3 text-sm">
          <span className="text-amber-900">Agreed no-show fee</span>
          <span className="font-semibold text-amber-900">{formatUsd(booking.noShowFee)}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3 text-sm">
          <span className="text-amber-900">Free cancel until</span>
          <span className="font-semibold text-amber-900">{booking.freeCancelDeadlineLabel}</span>
        </div>
        {booking.cancellationFeeCharged != null && booking.cancellationFeeCharged > 0 ? (
          <div className="mt-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="text-rose-800">Cancellation charge</span>
            <span className="font-semibold text-rose-800">
              {formatUsd(booking.cancellationFeeCharged)}
            </span>
          </div>
        ) : (
          <div className="mt-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="text-emerald-800">Charged today</span>
            <span className="font-semibold text-emerald-800">{formatUsd(0)}</span>
          </div>
        )}
        <p className="mt-2 text-[11px] text-amber-800/80 leading-relaxed">
          PayPal authorization only. Settlement uses the locked booking-time price and policy.
          Cancel before {booking.freeCancelDeadlineLabel} to release the hold at {formatUsd(0)}.
        </p>
      </div>

      {!isPlaceholderValue(booking.paypalAuthId) || !isPlaceholderValue(booking.consentHash) ? (
        <div className="mb-5 space-y-2 rounded-2xl border border-stone-100 px-4 py-3 font-mono text-[11px] text-stone-500">
          {!isPlaceholderValue(booking.paypalAuthId) ? (
            <div className="flex justify-between gap-3">
              <span className="font-sans text-stone-400">PayPal auth</span>
              <span className="truncate text-stone-700">{booking.paypalAuthId}</span>
            </div>
          ) : null}
          {!isPlaceholderValue(booking.consentHash) ? (
            <div className="break-all rounded-xl bg-stone-50 px-2.5 py-2 text-[10px] text-stone-600">
              {booking.consentHash}
            </div>
          ) : null}
        </div>
      ) : null}
    </CustomResponsiveDialog>
  )
}

/** Legacy export name. */
export { BookingReceipt as ReceiptModal }
