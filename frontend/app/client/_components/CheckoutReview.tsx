'use client'

import { AlertCircle, Lock, PencilLine, ShieldCheck } from 'lucide-react'
import { type MouseEvent, type ReactNode, useId, useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { formatUsd } from '@/lib/format'
import { formatDateInZone, formatTimeInZone, timeZoneAbbr } from '@/lib/util/timezone'
import { cn } from '@/lib/utils'

import type { CheckoutQuote } from './CheckoutSummary'
import { LegalDialog, type LegalDoc } from './LegalDialog'

function AgreementCheck({
  checked,
  onCheckedChange,
  invalid,
  children,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  invalid?: boolean
  children: ReactNode
}) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors',
        checked
          ? 'border-emerald-300 bg-emerald-50/60'
          : invalid
            ? 'border-rose-300 bg-rose-50/50'
            : 'border-stone-200 bg-white hover:border-stone-300',
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        aria-invalid={invalid || undefined}
        className="mt-0.5 size-5 rounded-md border-stone-300 bg-white data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white"
      />
      <span className="text-sm leading-relaxed text-stone-700">{children}</span>
    </label>
  )
}

export interface CheckoutReviewProps {
  serviceName: string
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
  onEditStylist: () => void
  onEditSchedule: () => void
}

export function CheckoutReview({
  serviceName,
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
  onEditStylist,
  onEditSchedule,
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
          </div>
          <button
            type="button"
            onClick={onEditStylist}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-50"
          >
            <PencilLine className="h-3.5 w-3.5" />
            Edit
          </button>
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
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-50"
          >
            <PencilLine className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
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

      {openDoc ? <LegalDialog doc={openDoc} onClose={() => setOpenDoc(null)} /> : null}
    </div>
  )
}
