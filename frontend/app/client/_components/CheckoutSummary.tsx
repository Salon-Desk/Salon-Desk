'use client'

import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Info,
  Lock,
  MapPin,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { formatDuration, formatUsd } from '@/lib/format'
import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'
import { formatDateInZone, formatTimeInZone, timeZoneAbbr } from '@/lib/util/timezone'
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
  serviceOrServices: SalonService | SalonService[],
  policy:
    | {
        name?: string | null
        free_cancel_hours?: number | null
        no_show_fee_percent?: number | null
        late_cancel_fee_percent?: number | null
      }
    | undefined,
  startsAt: string | null,
  partySize = 1,
): CheckoutQuote {
  const services = Array.isArray(serviceOrServices) ? serviceOrServices : [serviceOrServices]
  const round = (n: number) => Math.round(n * 100) / 100
  const freeCancelHours = policy?.free_cancel_hours ?? 24
  const noShowPct = policy?.no_show_fee_percent ?? 50
  const lateCancelPct = policy?.late_cancel_fee_percent ?? noShowPct
  const startMs = startsAt ? Date.parse(startsAt) : Number.NaN
  const multiplier = Math.max(1, partySize)
  const baseServicePrice = services.reduce((sum, s) => sum + s.price, 0)
  const baseCommission = services.reduce(
    (sum, s) => sum + (s.platformCommission ?? Math.max(0, (s.holdDeposit || s.price) - s.price)),
    0,
  )
  const totalPrice = baseServicePrice * multiplier
  const totalCommission = baseCommission * multiplier
  return {
    price: totalPrice,
    platformCommission: totalCommission,
    hold: totalPrice + totalCommission,
    policyName: policy?.name ?? null,
    freeCancelHours,
    lateCancelPct,
    lateCancelFee: round(totalPrice * (lateCancelPct / 100)),
    noShowPct,
    noShowFee: round(totalPrice * (noShowPct / 100)),
    freeCancelUntil: Number.isFinite(startMs)
      ? new Date(startMs - freeCancelHours * 3_600_000).toISOString()
      : null,
  }
}

import { SummaryRow } from './SummaryRow'

export interface CheckoutSummaryProps {
  service: SalonService
  services?: SalonService[]
  coverSrc: string
  salonName?: string
  orgId?: string
  address?: string | null
  stylistLabel: string
  startsAt: string | null
  displayTz: string
  quote: CheckoutQuote
  partySize?: number
  onOpenDetails?: () => void
  children?: ReactNode
}

export function CheckoutSummary({
  service,
  services,
  coverSrc,
  salonName,
  orgId,
  address,
  stylistLabel,
  startsAt,
  displayTz,
  quote,
  partySize = 1,
  onOpenDetails,
  children,
}: CheckoutSummaryProps) {
  const allServices = services && services.length > 0 ? services : [service]
  const totalDurationMin = allServices.reduce((acc, s) => acc + s.durationMin, 0)
  const endsAt = startsAt
    ? new Date(Date.parse(startsAt) + totalDurationMin * 60_000).toISOString()
    : null

  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_24px_48px_-24px_rgba(28,25,23,0.18)]">
      <div className="relative h-36 bg-stone-200">
        <Image
          src={coverSrc}
          alt=""
          fill
          unoptimized={shouldUnoptimizedImage(coverSrc)}
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

        {onOpenDetails && (
          <button
            type="button"
            onClick={onOpenDetails}
            className="absolute top-3 right-3 cursor-pointer rounded-full bg-stone-950/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md transition-colors hover:bg-stone-900"
          >
            Details &amp; Reviews
          </button>
        )}
      </div>

      <div className="space-y-4 p-5">
        {salonName ? (
          <SummaryRow icon={<MapPin className="h-4 w-4" />} label="Salon">
            {orgId ? (
              <Link
                href={`/client/org/${orgId}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-1 font-semibold text-stone-900 transition-colors hover:text-amber-800"
              >
                <span className="truncate">{salonName}</span>
                <ArrowUpRight className="h-3 w-3 text-stone-400 group-hover:text-amber-800" />
              </Link>
            ) : (
              <p className="truncate font-medium">{salonName}</p>
            )}
            {address ? (
              <p className="truncate text-xs font-normal text-stone-500">{address}</p>
            ) : null}
          </SummaryRow>
        ) : null}

        {onOpenDetails && (
          <button
            type="button"
            onClick={onOpenDetails}
            className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-amber-200/80 bg-amber-50/50 p-2.5 text-xs text-amber-950 transition-colors hover:bg-amber-100/60"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <Info className="h-3.5 w-3.5 text-amber-700" />
              <span>Service Details &amp; Past Reviews</span>
            </span>
            <span className="font-bold text-[11px] text-amber-700">View →</span>
          </button>
        )}

        {allServices.length > 1 ? (
          <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3 text-xs space-y-2">
            <p className="font-bold text-stone-900 text-[11px] uppercase tracking-wider">
              Selected Services ({allServices.length})
            </p>
            <div className="space-y-1.5 divide-y divide-stone-200/40">
              {allServices.map((s) => (
                <div key={s.id} className="flex items-center justify-between pt-1 text-stone-700">
                  <div className="truncate max-w-[190px]">
                    <span className="font-medium text-stone-900 block truncate">{s.name}</span>
                    <span className="text-[10px] text-stone-500">
                      {formatDuration(s.durationMin)}
                    </span>
                  </div>
                  <span className="font-semibold text-stone-900">{formatUsd(s.price)}</span>
                </div>
              ))}
            </div>
          </div>
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
          {formatDuration(totalDurationMin)}
        </SummaryRow>

        {partySize > 1 ? (
          <SummaryRow icon={<Users className="h-4 w-4" />} label="Party Size">
            {partySize} guests
          </SummaryRow>
        ) : null}

        <div className="space-y-2 rounded-2xl bg-stone-50 p-4 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Service price{partySize > 1 ? ` (${partySize} guests)` : ''}</span>
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
