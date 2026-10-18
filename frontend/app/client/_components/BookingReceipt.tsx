'use client'

import { Calendar, Clock, FileText, Lock, Store, User } from 'lucide-react'
import Image from 'next/image'

import { HoldStateBadge, Modal } from '@/components/ui'
import { formatBookingRef, formatDuration, formatUsd, isPlaceholderValue } from '@/lib/format'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import type { Booking } from '@/types'

interface ReceiptModalProps {
  booking: Booking
  onClose: () => void
}

function ReceiptRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">{label}</p>
        <p className="text-sm font-medium text-stone-900">{value}</p>
      </div>
    </div>
  )
}

export function BookingReceipt({ booking, onClose }: ReceiptModalProps) {
  const salonLine = [booking.salonName, formatBookingRef(booking.id)].filter(Boolean).join(' · ')

  return (
    <Modal
      onClose={onClose}
      size="md"
      icon={<FileText className="h-4 w-4" />}
      title={booking.serviceName}
      description={salonLine}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-full bg-stone-950 py-3 text-xs font-medium text-white transition-colors hover:bg-stone-800 sm:text-sm"
        >
          Close receipt
        </button>
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
            <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
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
        <p className="mb-5 flex items-start gap-2 rounded-xl bg-stone-50 px-3.5 py-2.5 text-xs text-stone-600">
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
          <span className="text-emerald-800">Charged today</span>
          <span className="font-semibold text-emerald-800">{formatUsd(0)}</span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-amber-800/80">
          PayPal authorization only. Settlement happens at the salon, and cancellation at least 24
          hours ahead releases the hold at {formatUsd(0)}.
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
    </Modal>
  )
}

/** Legacy export name. */
export { BookingReceipt as ReceiptModal }
