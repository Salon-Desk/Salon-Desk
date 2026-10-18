'use client'

import { Calendar, CheckCircle2, Clock, Lock, Sparkles, Star, User } from 'lucide-react'
import Image from 'next/image'

import { Button, Modal } from '@/components/ui'
import { ANY_AVAILABLE_STYLIST, INITIAL_STAFF } from '@/lib/data/catalog'
import { formatSlot, serviceImage, TIME_SLOTS } from '@/lib/data/service-content'
import { formatBookingRef, formatDuration, formatUsd, isPlaceholderValue } from '@/lib/format'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import type { Booking, SalonService, StaffMember } from '@/types'

export type AuthStep = 'review' | 'authorizing' | 'success'

const CHECKOUT_STYLISTS: StaffMember[] = [ANY_AVAILABLE_STYLIST, ...INITIAL_STAFF]

interface PaypalAuthModalProps {
  service: SalonService
  stylist: StaffMember
  slot: string
  step: AuthStep
  confirmedBooking: Booking | null
  onSelectStylist: (staff: StaffMember) => void
  onSelectSlot: (slot: string) => void
  onApprove: () => void
  onClose: () => void
  onViewBookings: () => void
}

export function PayPalHoldCheckout({
  service,
  stylist,
  slot,
  step,
  confirmedBooking,
  onSelectStylist,
  onSelectSlot,
  onApprove,
  onClose,
  onViewBookings,
}: PaypalAuthModalProps) {
  const salonName = service.organizationName
  const coverSrc = service.imageUrl || serviceImage(service.id)

  return (
    <Modal
      onClose={onClose}
      size="md"
      hideHeader={step !== 'review'}
      icon={<Lock className="h-4 w-4" />}
      title="Confirm booking with PayPal"
      description="Authorize a hold to confirm your appointment. Nothing is charged until settlement at the salon."
      footer={
        step === 'review' ? (
          <div className="w-full space-y-2">
            <Button
              variant="paypal"
              size="lg"
              fullWidth
              onClick={onApprove}
              className="rounded-full"
            >
              <Lock className="h-4 w-4" />
              Confirm &amp; authorize hold
            </Button>
            <p className="text-center text-[11px] text-stone-400">
              PayPal authorization confirms the booking. $0 leaves your account today. A
              confirmation email is sent after the hold succeeds.
            </p>
          </div>
        ) : undefined
      }
    >
      {step === 'review' && (
        <div>
          <div className="mb-5 flex gap-3 rounded-2xl bg-stone-50/90 p-3">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-200">
              <Image
                src={coverSrc}
                alt=""
                fill
                unoptimized={shouldUnoptimizeImage(coverSrc)}
                className="object-cover"
                sizes="96px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                {service.category}
              </p>
              <h4 className="font-serif text-lg font-normal leading-snug text-stone-950">
                {service.name}
              </h4>
              {salonName ? <p className="mt-0.5 text-xs text-stone-500">{salonName}</p> : null}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(service.durationMin)}
                </span>
                <span className="font-semibold text-stone-900">{formatUsd(service.price)}</span>
              </div>
            </div>
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Stylist
          </p>
          <div className="mb-5 grid grid-cols-2 gap-2">
            {CHECKOUT_STYLISTS.map((staff) => {
              const selected = stylist.id === staff.id
              return (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => onSelectStylist(staff)}
                  className={`flex items-center gap-2 rounded-2xl border px-2.5 py-2 text-left transition-all ${
                    selected
                      ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-300'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  {staff.avatar ? (
                    <Image
                      src={staff.avatar}
                      alt=""
                      width={32}
                      height={32}
                      unoptimized={shouldUnoptimizeImage(staff.avatar)}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500">
                      <User className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-stone-950">
                      {staff.id === ANY_AVAILABLE_STYLIST.id ? 'Any stylist' : staff.name}
                    </span>
                    {staff.rating > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-stone-500">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        {staff.rating.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400">Salon assigns</span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Time slot
          </p>
          <div className="mb-5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {TIME_SLOTS.slice(0, 4).map((item) => {
              const slotStr = formatSlot(item)
              const selected = slot === slotStr
              return (
                <button
                  key={slotStr}
                  type="button"
                  onClick={() => onSelectSlot(slotStr)}
                  className={`rounded-xl border px-2 py-2 text-center text-[11px] font-medium transition-all ${
                    selected
                      ? 'border-stone-950 bg-stone-950 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span className="block text-[10px] opacity-70">{item.day}</span>
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="mb-5 space-y-2 rounded-2xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-xs">
            <div className="flex justify-between gap-3 text-stone-700">
              <span>Service total</span>
              <span className="font-semibold text-stone-950">{formatUsd(service.price)}</span>
            </div>
            <div className="flex justify-between gap-3 text-stone-700">
              <span>Authorization hold (est.)</span>
              <span className="font-semibold text-amber-800">{formatUsd(service.holdDeposit)}</span>
            </div>
            <div className="flex justify-between gap-3 text-stone-700">
              <span>No-show fee (est.)</span>
              <span className="font-semibold text-stone-800">{formatUsd(service.noShowFee)}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-amber-200/70 pt-2">
              <span className="text-emerald-800">Due today</span>
              <span className="font-semibold text-emerald-800">{formatUsd(0)}</span>
            </div>
            <p className="pt-1 text-[11px] leading-relaxed text-amber-900/80">
              Exact hold amount, no-show fee, and free-cancel deadline are locked on the booking at
              confirmation from the salon&apos;s active policy — estimates above match typical
              full-ticket holds.
            </p>
          </div>
        </div>
      )}

      {step === 'authorizing' && (
        <div className="py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 animate-spin items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <h4 className="mb-2 font-serif text-xl font-normal text-stone-950">Placing your hold…</h4>
          <p className="mx-auto max-w-xs text-xs leading-relaxed text-stone-500">
            Confirming {service.name}
            {salonName ? ` at ${salonName}` : ''} and asking PayPal to authorize the booking hold
            without charging you.
          </p>
        </div>
      )}

      {step === 'success' && confirmedBooking && (
        <div className="py-2">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-2 py-1 text-xs text-stone-400 hover:text-stone-700"
            >
              Close
            </button>
          </div>
          <div className="mb-4 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              <Lock className="h-3 w-3" />
              Held {formatUsd(confirmedBooking.holdAmount)} · charged {formatUsd(0)}
            </p>
            <h3 className="font-serif text-2xl font-normal text-stone-950">You are booked</h3>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
              {confirmedBooking.serviceName} with {confirmedBooking.stylistName}
              {confirmedBooking.salonName ? ` at ${confirmedBooking.salonName}` : ''}. A
              confirmation email is on its way, and we&apos;ll remind you before the visit.
            </p>
          </div>

          <div className="mb-4 space-y-2 rounded-2xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-amber-900">Locked hold</span>
              <span className="font-semibold text-amber-900">
                {formatUsd(confirmedBooking.holdAmount)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-amber-900">Agreed no-show fee</span>
              <span className="font-semibold text-amber-900">
                {formatUsd(confirmedBooking.noShowFee)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-amber-900">Free cancel until</span>
              <span className="font-semibold text-amber-900">
                {confirmedBooking.freeCancelDeadlineLabel}
              </span>
            </div>
          </div>

          <div className="mb-6 space-y-3 rounded-2xl bg-stone-50/90 p-4 text-sm">
            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 h-3.5 w-3.5 text-stone-400" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                  Appointment
                </p>
                <p className="font-medium text-stone-900">{confirmedBooking.appointmentTime}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <User className="mt-0.5 h-3.5 w-3.5 text-stone-400" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
                  Reference
                </p>
                <p className="font-mono text-xs font-medium text-stone-900">
                  {formatBookingRef(confirmedBooking.id)}
                </p>
              </div>
            </div>
            {!isPlaceholderValue(confirmedBooking.paypalAuthId) ? (
              <p className="font-mono text-[11px] text-stone-400">
                PayPal {confirmedBooking.paypalAuthId}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="dark" onClick={onViewBookings} className="rounded-full">
              View bookings
            </Button>
            <Button variant="secondary" onClick={onClose} className="rounded-full">
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/** Legacy export name used across the client booking flow. */
export { PayPalHoldCheckout as PaypalAuthModal }
