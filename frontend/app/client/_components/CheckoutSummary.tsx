'use client'

import { CalendarDays, Clock, Lock, MapPin, ShieldCheck, User } from 'lucide-react'
import Image from 'next/image'
import type { ReactNode } from 'react'

import { formatDuration, formatUsd } from '@/lib/format'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import { formatDateInZone, formatTimeInZone, timeZoneAbbr } from '@/lib/util/timezone'
import { cn } from '@/lib/utils'
import type { SalonService } from '@/types'

export interface CheckoutQuote {
  price: number
  platformCommission: number
  hold: number
  policyName: string | null
  freeCancelHours: number
  lateCancelPct: number
  lateCancelFee: number
  noShowPct: number
  noShowFee: number
  /** ISO timestamp of the free-cancellation deadline, once a slot is picked. */
  freeCancelUntil: string | null
}

export function buildCheckoutQuote(
  service: SalonService,
  policy:
    | {
        name?: string | null
        free_cancel_hours?: number | null
        no_show_fee_percent?: number | null
        late_cancel_fee_percent?: number | null
      }
    | undefined,
  startsAt: string | null,
): CheckoutQuote {
  const round = (n: number) => Math.round(n * 100) / 100
  const freeCancelHours = policy?.free_cancel_hours ?? 24
  const noShowPct = policy?.no_show_fee_percent ?? 50
  const lateCancelPct = policy?.late_cancel_fee_percent ?? noShowPct
  const startMs = startsAt ? Date.parse(startsAt) : Number.NaN
  const platformCommission =
    service.platformCommission ??
    Math.max(0, (service.holdDeposit || service.price) - service.price)
  return {
    price: service.price,
    platformCommission,
    hold: service.holdDeposit || service.price + platformCommission,
    policyName: policy?.name ?? null,
    freeCancelHours,
    lateCancelPct,
    lateCancelFee: round(service.price * (lateCancelPct / 100)),
    noShowPct,
    noShowFee: round(service.price * (noShowPct / 100)),
    freeCancelUntil: Number.isFinite(startMs)
      ? new Date(startMs - freeCancelHours * 3_600_000).toISOString()
      : null,
  }
}

function SummaryRow({
  icon,
  label,
  children,
  muted,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
  muted?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</p>
        <div className={cn('text-sm', muted ? 'text-stone-400' : 'font-medium text-stone-900')}>
          {children}
        </div>
      </div>
    </div>
  )
}

export interface CheckoutSummaryProps {
  service: SalonService
  coverSrc: string
  salonName?: string
  address?: string | null
  stylistLabel: string
  startsAt: string | null
  displayTz: string
  quote: CheckoutQuote
  children?: ReactNode
}

export function CheckoutSummary({
  service,
  coverSrc,
  salonName,
  address,
  stylistLabel,
  startsAt,
  displayTz,
  quote,
  children,
}: CheckoutSummaryProps) {
  const endsAt = startsAt
    ? new Date(Date.parse(startsAt) + service.durationMin * 60_000).toISOString()
    : null

  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_24px_48px_-24px_rgba(28,25,23,0.18)]">
      <div className="relative h-36 bg-stone-200">
        <Image
          src={coverSrc}
          alt=""
          fill
          unoptimized={shouldUnoptimizeImage(coverSrc)}
          className="object-cover"
          sizes="(min-width: 1024px) 380px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent" />
        <div className="absolute inset-x-4 bottom-3 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
            {service.category}
          </p>
          <p className="truncate font-serif text-xl leading-tight">{service.name}</p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {salonName ? (
          <SummaryRow icon={<MapPin className="h-4 w-4" />} label="Salon">
            <p className="truncate">{salonName}</p>
            {address ? (
              <p className="truncate text-xs font-normal text-stone-500">{address}</p>
            ) : null}
          </SummaryRow>
        ) : null}

        <SummaryRow icon={<User className="h-4 w-4" />} label="Stylist">
          {stylistLabel}
        </SummaryRow>

        <SummaryRow
          icon={<CalendarDays className="h-4 w-4" />}
          label="Date & time"
          muted={!startsAt}
        >
          {startsAt && endsAt ? (
            <>
              <p>
                {formatDateInZone(startsAt, displayTz, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <p className="text-xs font-normal text-stone-500">
                {formatTimeInZone(startsAt, displayTz)} – {formatTimeInZone(endsAt, displayTz)}{' '}
                {timeZoneAbbr(displayTz, new Date(startsAt))}
              </p>
            </>
          ) : (
            'Not selected yet'
          )}
        </SummaryRow>

        <SummaryRow icon={<Clock className="h-4 w-4" />} label="Duration">
          {formatDuration(service.durationMin)}
        </SummaryRow>

        <div className="space-y-2 rounded-2xl bg-stone-50 p-4 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Service price</span>
            <span className="font-medium text-stone-900">{formatUsd(quote.price)}</span>
          </div>
          {quote.platformCommission > 0 ? (
            <div className="flex justify-between text-stone-600">
              <span>Platform fee</span>
              <span className="font-medium text-stone-900">
                {formatUsd(quote.platformCommission)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between text-stone-600">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-amber-700" />
              PayPal hold (service + platform fee)
            </span>
            <span className="font-medium text-stone-900">{formatUsd(quote.hold)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-stone-200 pt-2">
            <span className="font-semibold text-stone-900">Due today</span>
            <span className="font-serif text-2xl text-emerald-700">{formatUsd(0)}</span>
          </div>
        </div>

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-stone-500">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
          Free cancellation up to {quote.freeCancelHours}h before your appointment. The hold is
          released if you cancel in time.
        </p>

        {children}
      </div>
    </div>
  )
}
