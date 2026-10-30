'use client'

import { Clock, Info, Minus, Plus, Sparkles, Trash2, Users } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

import { serviceImage } from '@/lib/data/service-content'
import { formatDuration, formatUsd } from '@/lib/format'
import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'
import { cn } from '@/lib/utils'
import type { SalonService } from '@/types'

export interface CheckoutGuestServiceSelectionProps {
  partySize: number
  onPartySizeChange: (size: number) => void
  services: SalonService[]
  onOpenServiceModal?: () => void
  onRemoveService?: (service: SalonService) => void
}

export function CheckoutGuestServiceSelection({
  partySize,
  onPartySizeChange,
  services,
  onOpenServiceModal,
  onRemoveService,
}: CheckoutGuestServiceSelectionProps) {
  const totalDurationMin = services.reduce((acc, s) => acc + s.durationMin, 0)
  const basePrice = services.reduce((acc, s) => acc + s.price, 0)
  const totalPrice = basePrice * partySize

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-200">
      {/* 1. NUMBER OF GUESTS (PARTY SIZE) */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-2xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-900">
                <Users className="h-4 w-4" />
              </span>
              <h2 className="font-serif text-xl text-stone-950 sm:text-2xl">
                How many guests are coming?
              </h2>
            </div>
            <p className="mt-1 text-xs text-stone-500 sm:text-sm">
              Booking for yourself or a group? Service price and hold deposit scale per guest.
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start rounded-full border border-stone-200 bg-stone-50 p-1 sm:self-auto">
            {[1, 2, 3, 4, 5].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onPartySizeChange(count)}
                className={cn(
                  'h-8 w-8 rounded-full text-xs font-bold transition-all cursor-pointer',
                  partySize === count
                    ? 'bg-stone-950 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-950',
                )}
              >
                {count}
              </button>
            ))}

            {/* Stepper buttons for 6-10 guests */}
            <div className="flex items-center border-l border-stone-200 pl-1.5 ml-0.5">
              <button
                type="button"
                aria-label="Decrease party size"
                disabled={partySize <= 1}
                onClick={() => onPartySizeChange(Math.max(1, partySize - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full text-stone-500 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="px-1.5 text-xs font-bold text-stone-900 min-w-[20px] text-center">
                {partySize}
              </span>
              <button
                type="button"
                aria-label="Increase party size"
                disabled={partySize >= 10}
                onClick={() => onPartySizeChange(Math.min(10, partySize + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full text-stone-500 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {partySize > 1 ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-50/70 border border-amber-200/80 px-4 py-2.5 text-xs text-amber-950">
            <Info className="h-4 w-4 shrink-0 text-amber-700" />
            <p>
              Group booking for <span className="font-bold">{partySize} guests</span>. Each guest
              will receive all selected services ({formatUsd(basePrice)} × {partySize} ={' '}
              <span className="font-bold">{formatUsd(totalPrice)}</span> total).
            </p>
          </div>
        ) : null}
      </div>

      {/* 2. SERVICES SELECTION */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-2xs sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-serif text-xl text-stone-950">Selected Services</h3>
            <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">
              You can combine multiple services into this single booking.
            </p>
          </div>

          {onOpenServiceModal && (
            <button
              type="button"
              onClick={onOpenServiceModal}
              className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-full border border-amber-300 bg-amber-50/80 px-4 py-2 text-xs font-bold text-amber-950 shadow-2xs transition-colors hover:bg-amber-100 sm:self-auto"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Add / Remove Services</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {services.map((svc) => {
            const img = svc.imageUrl || serviceImage(svc.id)
            return (
              <div
                key={svc.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-stone-50/50 p-3.5 transition-all hover:bg-stone-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-stone-200">
                    <Image
                      src={img}
                      alt=""
                      fill
                      unoptimized={shouldUnoptimizedImage(img)}
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                      {svc.category}
                    </span>
                    <p className="truncate font-semibold text-stone-900 text-sm">{svc.name}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-stone-400" />
                        {formatDuration(svc.durationMin)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-stone-900 text-sm">{formatUsd(svc.price)}</span>
                  {services.length > 1 && onRemoveService ? (
                    <button
                      type="button"
                      aria-label={`Remove ${svc.name}`}
                      onClick={() => onRemoveService(svc)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        {/* Totals Banner */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-100/80 px-4 py-3 text-xs text-stone-600">
          <div>
            <span>Combined duration: </span>
            <span className="font-bold text-stone-900">{formatDuration(totalDurationMin)}</span>
          </div>
          <div>
            <span>
              Total for {partySize} guest{partySize > 1 ? 's' : ''}:{' '}
            </span>
            <span className="font-bold text-stone-950 text-sm">{formatUsd(totalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
