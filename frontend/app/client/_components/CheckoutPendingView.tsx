'use client'

import { CalendarCheck2, Loader2 } from 'lucide-react'
import React from 'react'

import type { SalonService } from '@/types'

import { CheckoutHeader } from './CheckoutHeader'
import { StatusPanel } from './StatusPanel'

export interface CheckoutPendingViewProps {
  step: 'authorizing' | 'awaiting_paypal'
  service: SalonService
  salonName?: string
  selectionLabel: string | null
  onExit: () => void
}

export function CheckoutPendingView({
  step,
  service,
  salonName,
  selectionLabel,
  onExit,
}: CheckoutPendingViewProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fbfbfa]">
      <CheckoutHeader onExit={onExit} />
      <main className="flex flex-1 items-center px-4 py-10">
        <StatusPanel>
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <h1 className="font-serif text-2xl text-stone-950">
              {step === 'awaiting_paypal' ? 'Opening PayPal…' : 'Preparing your hold…'}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-stone-500 text-sm leading-relaxed">
              {step === 'awaiting_paypal'
                ? 'Approve the authorization on PayPal to confirm. You will return here when done.'
                : `Creating a PayPal authorization for ${service.name}${salonName ? ` at ${salonName}` : ''}.`}
            </p>
            {selectionLabel ? (
              <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 font-medium text-stone-700 text-xs">
                <CalendarCheck2 className="h-3.5 w-3.5 text-amber-700" />
                {selectionLabel}
              </p>
            ) : null}
          </div>
        </StatusPanel>
      </main>
    </div>
  )
}
