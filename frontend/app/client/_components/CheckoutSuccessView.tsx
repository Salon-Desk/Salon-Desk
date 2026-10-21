'use client'

import { CheckCircle2, Lock } from 'lucide-react'
import React from 'react'

import { PrimaryButton } from '@/components/button'
import { formatBookingRef, formatUsd, isPlaceholderValue } from '@/lib/format'
import type { Booking } from '@/types'

import { CheckoutHeader } from './CheckoutHeader'
import { StatusPanel } from './StatusPanel'

export interface CheckoutSuccessViewProps {
  confirmedBooking: Booking
  onExit: () => void
  onViewBookings: () => void
}

export function CheckoutSuccessView({
  confirmedBooking,
  onExit,
  onViewBookings,
}: CheckoutSuccessViewProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fbfbfa]">
      <CheckoutHeader onExit={onExit} />
      <main className="flex flex-1 items-center px-4 py-10">
        <StatusPanel>
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800 text-xs">
              <Lock className="h-3 w-3" />
              Held {formatUsd(confirmedBooking.holdAmount)} · charged {formatUsd(0)}
            </p>
            <h1 className="font-serif text-3xl text-stone-950">You are booked</h1>
            <p className="mt-1 max-w-sm text-stone-500 text-sm leading-relaxed">
              {confirmedBooking.serviceName} with {confirmedBooking.stylistName}
              {confirmedBooking.salonName ? ` at ${confirmedBooking.salonName}` : ''}.
            </p>
          </div>
          <div className="mb-6 space-y-1.5 rounded-2xl bg-stone-50 p-4 text-sm">
            <p className="font-medium text-stone-900">{confirmedBooking.appointmentTime}</p>
            <p className="font-mono text-stone-500 text-xs">
              Ref {formatBookingRef(confirmedBooking.id)}
            </p>
            {!isPlaceholderValue(confirmedBooking.paypalAuthId) ? (
              <p className="font-mono text-[11px] text-stone-400">
                PayPal {confirmedBooking.paypalAuthId}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <PrimaryButton
              variant="dark"
              size="lg"
              onClick={onViewBookings}
              className="rounded-full h-12 text-sm font-semibold"
              title="View bookings"
              fullWidth
            />
            <PrimaryButton
              variant="secondary"
              size="lg"
              onClick={onExit}
              className="rounded-full h-12 text-sm font-semibold"
              title="Keep browsing"
              fullWidth
            />
          </div>
        </StatusPanel>
      </main>
    </div>
  )
}
