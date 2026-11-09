'use client'

import { AlertCircle, Lock, PencilLine, Phone, ShieldCheck, Users } from 'lucide-react'
import { type MouseEvent, type ReactNode, useState } from 'react'

import { ANY_AVAILABLE_STYLIST } from '@/lib/data/catalog'
import { formatDuration, formatUsd } from '@/lib/format'
import { formatDateInZone, formatTimeInZone, timeZoneAbbr } from '@/lib/util/timezone'
import type { SalonService, StaffMember } from '@/types'

import { AgreementCheck } from './AgreementCheck'
import type { CheckoutQuote } from './CheckoutSummary'
import { LegalDialog, type LegalDoc } from './LegalDialog'

export interface CheckoutReviewProps {
  serviceName: string
  services?: SalonService[]
  serviceStylistMap?: Record<string, StaffMember>
  salonName?: string
  stylistLabel: string
  startsAt: string | null
  durationMin: number
  displayTz: string
  quote: CheckoutQuote
  agreedPolicy: boolean
  agreedTerms: boolean
  onAgreedPolicyChange: (value: boolean) => void
  onAgreedTermsChange: (value: boolean) => void
  showErrors: boolean
  onEditGuestsServices?: () => void
  onEditStylist: () => void
  onEditSchedule: () => void
  partySize?: number
  onPartySizeChange?: (size: number) => void
  clientPhone?: string
  onClientPhoneChange?: (phone: string) => void
  phoneError?: string
  smartButtons?: ReactNode
}

export function CheckoutReview({
  serviceName,
  services,
  serviceStylistMap,
  salonName,
  stylistLabel,
  startsAt,
  durationMin,
  displayTz,
  quote,
  agreedPolicy,
  agreedTerms,
  onAgreedPolicyChange,
  onAgreedTermsChange,
  showErrors,
  onEditGuestsServices,
  onEditStylist,
  onEditSchedule,
  partySize = 1,
  onPartySizeChange,
  clientPhone,
  onClientPhoneChange,
  phoneError,
  smartButtons,
}: CheckoutReviewProps) {
  const [openDoc, setOpenDoc] = useState<LegalDoc | null>(null)
  const endsAt = startsAt
    ? new Date(Date.parse(startsAt) + durationMin * 60_000).toISOString()
    : null
  const freeCancelLabel = quote.freeCancelUntil
    ? `${formatDateInZone(quote.freeCancelUntil, displayTz, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })} at ${formatTimeInZone(quote.freeCancelUntil, displayTz)}`
    : `${quote.freeCancelHours}h before your appointment`

  const openLegal = (doc: LegalDoc) => (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setOpenDoc(doc)
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-2 space-y-6 duration-200">
      <div>
        <h2 className="font-serif text-2xl text-stone-950">Review &amp; agree</h2>
        <p className="mt-1 text-sm text-stone-500">
          Check your appointment, accept the policy, then approve the hold on PayPal. Nothing is
          charged today.
        </p>
      </div>

      <section className="divide-y divide-stone-100 rounded-3xl border border-stone-200 bg-white">
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Appointment
            </p>
            <p className="mt-0.5 font-semibold text-stone-900">{serviceName}</p>
            <p className="text-sm text-stone-500">
              {salonName ? `${salonName} · ` : ''}
              {stylistLabel}
            </p>
            {services && services.length > 1 ? (
              <div className="mt-3 space-y-1.5 rounded-2xl border border-stone-100 bg-stone-50/80 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Included Services ({services.length})
                </p>
                {services.map((s) => {
                  const assigned = serviceStylistMap?.[s.id]
                  const stylistText =
                    !assigned || assigned.id === ANY_AVAILABLE_STYLIST.id
                      ? 'Any available'
                      : assigned.name
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-xs text-stone-700"
                    >
                      <div className="truncate pr-2">
                        <span className="font-medium text-stone-900 block truncate">{s.name}</span>
                        <span className="text-[10px] text-stone-500">
                          {formatDuration(s.durationMin)} · Stylist: {stylistText}
                        </span>
                      </div>
                      <span className="shrink-0 font-semibold text-stone-900">
                        {formatUsd(s.price)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
            {onEditGuestsServices && (
              <button
                type="button"
                onClick={onEditGuestsServices}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700 shadow-2xs transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 active:scale-[0.97]"
              >
                <PencilLine className="h-3 w-3 text-stone-400" />
                <span>Services</span>
              </button>
            )}
            <button
              type="button"
              onClick={onEditStylist}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700 shadow-2xs transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 active:scale-[0.97]"
            >
              <PencilLine className="h-3 w-3 text-stone-400" />
              <span>Stylist</span>
            </button>
          </div>
        </div>
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">When</p>
            {startsAt && endsAt ? (
              <>
                <p className="mt-0.5 font-semibold text-stone-900">
                  {formatDateInZone(startsAt, displayTz)}
                </p>
                <p className="text-sm text-stone-500">
                  {formatTimeInZone(startsAt, displayTz)} – {formatTimeInZone(endsAt, displayTz)}{' '}
                  {timeZoneAbbr(displayTz, new Date(startsAt))}
                </p>
              </>
            ) : (
              <p className="mt-0.5 text-sm text-rose-600">Pick a day and time first.</p>
            )}
          </div>
          <button
            type="button"
            onClick={onEditSchedule}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700 shadow-2xs transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 active:scale-[0.97]"
          >
            <PencilLine className="h-3 w-3 text-stone-400" />
            <span>Edit</span>
          </button>
        </div>
      </section>

      {/* Party Size & Contact Details */}
      <section className="divide-y divide-stone-100 rounded-3xl border border-stone-200 bg-white">
        {onPartySizeChange ? (
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-stone-400" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Party Size
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-stone-500">
                  {partySize > 1
                    ? `Booking for ${partySize} guests (${formatUsd(quote.price)} total)`
                    : 'Booking for 1 person'}
                </p>
              </div>
              <div className="flex items-center gap-1 self-start rounded-full border border-stone-200 bg-stone-50 p-1 sm:self-auto">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => onPartySizeChange(count)}
                    className={`h-7 w-7 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      partySize === count
                        ? 'bg-stone-950 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/60'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {onClientPhoneChange ? (
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-stone-400" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Client Phone <span className="text-rose-600">*</span>
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-stone-500">
                  Required for appointment confirmations and salon contact.
                </p>
                <input
                  type="tel"
                  value={clientPhone ?? ''}
                  onChange={(e) => onClientPhoneChange(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={`mt-2 w-full max-w-sm rounded-xl border px-3 py-1.5 text-xs text-stone-900 transition-colors focus:outline-hidden ${
                    phoneError && showErrors
                      ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500'
                      : 'border-stone-200 bg-stone-50/50 focus:border-amber-500 focus:bg-white'
                  }`}
                />
                {phoneError && showErrors ? (
                  <p className="mt-1 text-xs font-medium text-rose-600">{phoneError}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/40">
        <div className="flex items-center gap-2 border-b border-amber-200/70 px-4 py-3 sm:px-5">
          <ShieldCheck className="h-4 w-4 text-amber-800" />
          <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Cancellation policy{quote.policyName ? ` · ${quote.policyName}` : ''}
          </p>
        </div>
        <dl className="grid gap-px bg-amber-200/50 sm:grid-cols-3">
          <div className="bg-amber-50/90 p-4">
            <dt className="text-[11px] text-stone-500">Free cancellation until</dt>
            <dd className="mt-0.5 text-sm font-semibold text-stone-900">{freeCancelLabel}</dd>
          </div>
          <div className="bg-amber-50/90 p-4">
            <dt className="text-[11px] text-stone-500">Late cancellation fee</dt>
            <dd className="mt-0.5 text-sm font-semibold text-stone-900">
              {formatUsd(quote.lateCancelFee)}{' '}
              <span className="font-normal text-stone-500">({quote.lateCancelPct}%)</span>
            </dd>
          </div>
          <div className="bg-amber-50/90 p-4">
            <dt className="text-[11px] text-stone-500">No-show fee</dt>
            <dd className="mt-0.5 text-sm font-semibold text-stone-900">
              {formatUsd(quote.noShowFee)}{' '}
              <span className="font-normal text-stone-500">({quote.noShowPct}%)</span>
            </dd>
          </div>
        </dl>
        <div className="flex items-center justify-between gap-3 bg-white/70 px-4 py-3 text-sm sm:px-5">
          <span className="inline-flex items-center gap-1.5 text-stone-600">
            <Lock className="h-3.5 w-3.5 text-amber-700" />
            Authorization hold {formatUsd(quote.hold)}
          </span>
          <span className="font-semibold text-emerald-700">{formatUsd(0)} due today</span>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Your agreement</p>
        <AgreementCheck
          checked={agreedPolicy}
          onCheckedChange={onAgreedPolicyChange}
          invalid={showErrors && !agreedPolicy}
        >
          I agree to the salon&apos;s cancellation policy and authorize a PayPal hold of{' '}
          <span className="font-semibold text-stone-900">{formatUsd(quote.hold)}</span>. If I cancel
          after {freeCancelLabel} or miss the appointment, the matching fee may be captured from the
          hold.
        </AgreementCheck>
        <AgreementCheck
          checked={agreedTerms}
          onCheckedChange={onAgreedTermsChange}
          invalid={showErrors && !agreedTerms}
        >
          I have read and accept the{' '}
          <button
            type="button"
            onClick={openLegal('terms')}
            className="font-semibold text-amber-800 underline decoration-amber-300 underline-offset-2 hover:text-amber-900"
          >
            Terms of Service
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={openLegal('privacy')}
            className="font-semibold text-amber-800 underline decoration-amber-300 underline-offset-2 hover:text-amber-900"
          >
            Privacy Policy
          </button>
          .
        </AgreementCheck>
        {showErrors && (!agreedPolicy || !agreedTerms) ? (
          <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
            <AlertCircle className="h-3.5 w-3.5" />
            Please accept both agreements to continue to PayPal.
          </p>
        ) : null}
      </section>

      {smartButtons ? <section className="pt-1">{smartButtons}</section> : null}

      {openDoc ? <LegalDialog doc={openDoc} onClose={() => setOpenDoc(null)} /> : null}
    </div>
  )
}
