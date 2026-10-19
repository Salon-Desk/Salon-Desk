'use client'

import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  MapPin,
  Sparkles,
  Star,
  User,
} from 'lucide-react'
import Image from 'next/image'
import { type ReactNode, useMemo, useState } from 'react'

import { UserMenu } from '@/components/auth/user-menu'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui'
import { ANY_AVAILABLE_STYLIST } from '@/lib/data/catalog'
import { serviceImage } from '@/lib/data/service-content'
import { formatBookingRef, formatDuration, formatUsd, isPlaceholderValue } from '@/lib/format'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import {
  browserTimeZone,
  formatDateInZone,
  formatTimeInZone,
  ymdInTimeZone,
} from '@/lib/util/timezone'
import { cn } from '@/lib/utils'
import {
  useGetCatalogCancellationPolicyQuery,
  useGetCatalogOrganizationQuery,
} from '@/store/api/clientApi'
import type { Booking, SalonService, StaffMember } from '@/types'

import { CheckoutReview } from './CheckoutReview'
import { CheckoutSchedule } from './CheckoutSchedule'
import { buildCheckoutQuote, CheckoutSummary } from './CheckoutSummary'

export type AuthStep = 'review' | 'authorizing' | 'awaiting_paypal' | 'success'

export type CheckoutWizardStep = 1 | 2 | 3

const WIZARD_STEPS = [
  { id: 1 as const, label: 'Stylist' },
  { id: 2 as const, label: 'Date & time' },
  { id: 3 as const, label: 'Review & agree' },
]

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Africa/Addis_Ababa',
  'Asia/Dubai',
  'UTC',
] as const

function BookingStepper({
  current,
  subtitles,
  onStepClick,
}: {
  current: CheckoutWizardStep
  subtitles: Record<CheckoutWizardStep, string | null>
  onStepClick: (step: CheckoutWizardStep) => void
}) {
  return (
    <ol className="flex items-start">
      {WIZARD_STEPS.map((s, index) => {
        const done = current > s.id
        const active = current === s.id
        const last = index === WIZARD_STEPS.length - 1
        return (
          <li key={s.id} className={cn('flex items-start', !last && 'flex-1')}>
            <button
              type="button"
              disabled={!done}
              onClick={() => onStepClick(s.id)}
              className="flex min-w-0 items-center gap-2.5 text-left disabled:cursor-default"
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all',
                  done && 'bg-emerald-600 text-white',
                  active && 'bg-stone-950 text-white ring-4 ring-amber-200/70',
                  !done && !active && 'border border-stone-200 bg-white text-stone-400',
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : s.id}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span
                  className={cn(
                    'block text-xs font-semibold',
                    active || done ? 'text-stone-900' : 'text-stone-400',
                  )}
                >
                  {s.label}
                </span>
                <span className="block max-w-[11rem] truncate text-[11px] text-stone-500">
                  {subtitles[s.id] ?? (active ? 'In progress' : '—')}
                </span>
              </span>
            </button>
            {!last ? (
              <span
                className={cn(
                  'mx-2 mt-[18px] h-0.5 flex-1 rounded-full sm:mx-4',
                  done ? 'bg-emerald-500' : 'bg-stone-200',
                )}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function StylistPicker({
  stylist,
  staffOptions,
  isLoading,
  onSelect,
}: {
  stylist: StaffMember
  staffOptions: StaffMember[]
  isLoading?: boolean
  onSelect: (staff: StaffMember) => void
}) {
  const choices = [ANY_AVAILABLE_STYLIST, ...staffOptions]

  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-200">
      <h2 className="font-serif text-2xl text-stone-950">Who would you like?</h2>
      <p className="mt-1 mb-5 text-sm text-stone-500">
        Choose a stylist, or let the salon assign whoever is free at your time.
      </p>
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-stone-200 bg-stone-50 py-14 text-sm text-stone-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading salon team…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {choices.map((staff) => {
            const selected = stylist.id === staff.id
            const isAny = staff.id === ANY_AVAILABLE_STYLIST.id
            return (
              <button
                key={staff.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(staff)}
                className={cn(
                  'relative flex items-start gap-3 rounded-3xl border p-4 text-left transition-all active:scale-[0.99]',
                  selected
                    ? 'border-stone-950 bg-white shadow-[0_12px_28px_-16px_rgba(28,25,23,0.45)] ring-1 ring-stone-950'
                    : 'border-stone-200 bg-white hover:border-amber-300 hover:shadow-sm',
                )}
              >
                {staff.avatar ? (
                  <Image
                    src={staff.avatar}
                    alt=""
                    width={52}
                    height={52}
                    unoptimized={shouldUnoptimizeImage(staff.avatar)}
                    className="h-13 w-13 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700">
                    <Sparkles className="h-5 w-5" />
                  </span>
                )}
                <span className="min-w-0 flex-1 pr-6">
                  <span className="block truncate text-sm font-semibold text-stone-950">
                    {isAny ? 'Any available stylist' : staff.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-stone-500">{staff.role}</span>
                  {staff.rating > 0 ? (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-stone-600">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{staff.rating.toFixed(2)}</span>
                      <span className="text-stone-400">({staff.reviewsCount})</span>
                    </span>
                  ) : (
                    <span className="mt-1.5 block text-xs text-emerald-700">Most availability</span>
                  )}
                  {staff.specialties.length > 0 ? (
                    <span className="mt-2 flex flex-wrap gap-1">
                      {staff.specialties.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    'absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
                    selected ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-300',
                  )}
                >
                  {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </span>
              </button>
            )
          })}
        </div>
      )}
      {!isLoading && staffOptions.length === 0 ? (
        <p className="mt-3 text-xs text-stone-500">
          This salon has not listed individual stylists yet — we will assign the next available
          professional when you book.
        </p>
      ) : null}
    </div>
  )
}

function CheckoutHeader({ onExit }: { onExit: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to services</span>
        </button>
        <Logo theme="light" size="sm" linkToHome={false} />
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 text-[11px] font-medium text-stone-400 md:inline-flex">
            <Lock className="h-3 w-3" />
            Secure checkout
          </span>
          <UserMenu portal="client" />
        </div>
      </div>
    </header>
  )
}

function StatusPanel({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_24px_48px_-24px_rgba(28,25,23,0.18)] sm:p-8">
      {children}
    </div>
  )
}

export interface PayPalHoldCheckoutProps {
  service: SalonService
  stylist: StaffMember
  staffOptions: StaffMember[]
  staffLoading?: boolean
  startsAt: string | null
  step: AuthStep
  confirmedBooking: Booking | null
  initialWizardStep?: CheckoutWizardStep
  /** Banner rendered above the wizard, e.g. after a cancelled PayPal approval. */
  notice?: ReactNode
  onSelectStylist: (staff: StaffMember) => void
  onSelectStartsAt: (iso: string | null) => void
  onApprove: () => void
  onExit: () => void
  onViewBookings: () => void
}

export function PayPalHoldCheckout({
  service,
  stylist,
  staffOptions,
  staffLoading = false,
  startsAt,
  step,
  confirmedBooking,
  initialWizardStep = 1,
  notice,
  onSelectStylist,
  onSelectStartsAt,
  onApprove,
  onExit,
  onViewBookings,
}: PayPalHoldCheckoutProps) {
  const salonName = service.organizationName
  const coverSrc = service.imageUrl || serviceImage(service.id)
  const orgId = service.organizationId

  const { data: org } = useGetCatalogOrganizationQuery(orgId ?? '', { skip: !orgId })
  const { data: policy } = useGetCatalogCancellationPolicyQuery(orgId ?? '', { skip: !orgId })

  const salonTz = org?.timezone?.trim() || 'UTC'
  const [tzOverride, setTzOverride] = useState<string | null>(null)
  const displayTz = tzOverride ?? salonTz
  const todayYmd = useMemo(() => ymdInTimeZone(new Date(), salonTz), [salonTz])
  const [pickedDay, setPickedDay] = useState<string | null>(null)
  const selectedDay =
    pickedDay ?? (startsAt ? ymdInTimeZone(new Date(startsAt), salonTz) : todayYmd)

  const [wizardStep, setWizardStep] = useState<CheckoutWizardStep>(
    initialWizardStep === 3 && !startsAt ? 2 : initialWizardStep,
  )
  const [agreedPolicy, setAgreedPolicy] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  const quote = buildCheckoutQuote(service, policy, startsAt)
  const stylistLabel =
    stylist.id === ANY_AVAILABLE_STYLIST.id ? 'Any available stylist' : stylist.name

  const timezoneOptions = useMemo(() => {
    const browserTz = browserTimeZone()
    const opts: { value: string; label: string }[] = [
      { value: salonTz, label: `Salon time · ${salonTz.replace(/_/g, ' ')}` },
    ]
    if (browserTz !== salonTz) {
      opts.push({ value: browserTz, label: `My time · ${browserTz.replace(/_/g, ' ')}` })
    }
    for (const tz of COMMON_TIMEZONES) {
      if (tz !== salonTz && tz !== browserTz) {
        opts.push({ value: tz, label: tz.replace(/_/g, ' ') })
      }
    }
    return opts
  }, [salonTz])

  const goToStep = (next: CheckoutWizardStep) => {
    setWizardStep(next)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const agreed = agreedPolicy && agreedTerms
  const canContinue = wizardStep === 1 ? Boolean(stylist?.id) : Boolean(startsAt)

  const handlePrimary = () => {
    if (wizardStep < 3) {
      if (canContinue) goToStep((wizardStep + 1) as CheckoutWizardStep)
      return
    }
    if (!startsAt) {
      goToStep(2)
      return
    }
    if (!agreed) {
      setShowErrors(true)
      return
    }
    onApprove()
  }

  const handleBack = () => {
    if (wizardStep > 1) goToStep((wizardStep - 1) as CheckoutWizardStep)
    else onExit()
  }

  const selectionLabel = startsAt
    ? `${formatDateInZone(startsAt, displayTz, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })} · ${formatTimeInZone(startsAt, displayTz)}`
    : null

  const primaryLabel =
    wizardStep === 3 ? 'Continue to PayPal' : wizardStep === 2 ? 'Review booking' : 'Choose time'

  const primaryButton = (
    <Button
      variant={wizardStep === 3 ? 'paypal' : 'dark'}
      size="lg"
      className="flex-1 rounded-full"
      disabled={wizardStep < 3 && !canContinue}
      onClick={handlePrimary}
    >
      {wizardStep === 3 ? <Lock className="h-4 w-4" /> : null}
      {primaryLabel}
      {wizardStep < 3 ? <ArrowRight className="h-4 w-4" /> : null}
    </Button>
  )

  const backButton = (
    <Button variant="secondary" size="lg" className="rounded-full" onClick={handleBack}>
      <ArrowLeft className="h-4 w-4" />
      {wizardStep > 1 ? 'Back' : 'Cancel'}
    </Button>
  )

  if (step === 'authorizing' || step === 'awaiting_paypal') {
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
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
                {step === 'awaiting_paypal'
                  ? 'Approve the authorization on PayPal to confirm. You will return here when done.'
                  : `Creating a PayPal authorization for ${service.name}${salonName ? ` at ${salonName}` : ''}.`}
              </p>
              {selectionLabel ? (
                <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700">
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

  if (step === 'success' && confirmedBooking) {
    return (
      <div className="flex min-h-dvh flex-col bg-[#fbfbfa]">
        <CheckoutHeader onExit={onExit} />
        <main className="flex flex-1 items-center px-4 py-10">
          <StatusPanel>
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                <Lock className="h-3 w-3" />
                Held {formatUsd(confirmedBooking.holdAmount)} · charged {formatUsd(0)}
              </p>
              <h1 className="font-serif text-3xl text-stone-950">You are booked</h1>
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-stone-500">
                {confirmedBooking.serviceName} with {confirmedBooking.stylistName}
                {confirmedBooking.salonName ? ` at ${confirmedBooking.salonName}` : ''}.
              </p>
            </div>
            <div className="mb-6 space-y-1.5 rounded-2xl bg-stone-50 p-4 text-sm">
              <p className="font-medium text-stone-900">{confirmedBooking.appointmentTime}</p>
              <p className="font-mono text-xs text-stone-500">
                Ref {formatBookingRef(confirmedBooking.id)}
              </p>
              {!isPlaceholderValue(confirmedBooking.paypalAuthId) ? (
                <p className="font-mono text-[11px] text-stone-400">
                  PayPal {confirmedBooking.paypalAuthId}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Button variant="dark" size="lg" onClick={onViewBookings} className="rounded-full">
                View bookings
              </Button>
              <Button variant="secondary" size="lg" onClick={onExit} className="rounded-full">
                Keep browsing
              </Button>
            </div>
          </StatusPanel>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#fbfbfa] text-stone-900">
      <CheckoutHeader onExit={onExit} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pt-10 lg:pb-16">
        <div className="mb-6 flex items-center gap-4 lg:mb-8">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-stone-200 lg:hidden">
            <Image
              src={coverSrc}
              alt=""
              fill
              unoptimized={shouldUnoptimizeImage(coverSrc)}
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
              Book appointment
            </p>
            <h1 className="truncate font-serif text-2xl text-stone-950 sm:text-3xl">
              {service.name}
            </h1>
            <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-stone-500 sm:text-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
              <span className="truncate">
                {[salonName, org?.physical_address].filter(Boolean).join(' · ') || 'Salon'}
              </span>
              <span className="shrink-0">
                · {formatDuration(service.durationMin)} · {formatUsd(service.price)}
              </span>
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-stone-200 bg-white px-4 py-4 sm:px-6">
          <BookingStepper
            current={wizardStep}
            subtitles={{ 1: stylistLabel, 2: selectionLabel, 3: null }}
            onStepClick={goToStep}
          />
        </div>

        {notice ? <div className="mb-6">{notice}</div> : null}

        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          <section className="min-w-0">
            {wizardStep === 1 && (
              <StylistPicker
                stylist={stylist}
                staffOptions={staffOptions}
                isLoading={staffLoading}
                onSelect={onSelectStylist}
              />
            )}
            {wizardStep === 2 && (
              <CheckoutSchedule
                serviceId={service.id}
                durationMin={service.durationMin}
                salonTz={salonTz}
                displayTz={displayTz}
                timezoneOptions={timezoneOptions}
                onDisplayTzChange={setTzOverride}
                todayYmd={todayYmd}
                selectedDay={selectedDay}
                onSelectDay={setPickedDay}
                startsAt={startsAt}
                onSelectStartsAt={onSelectStartsAt}
              />
            )}
            {wizardStep === 3 && (
              <CheckoutReview
                serviceName={service.name}
                salonName={salonName}
                stylistLabel={stylistLabel}
                startsAt={startsAt}
                durationMin={service.durationMin}
                displayTz={displayTz}
                quote={quote}
                agreedPolicy={agreedPolicy}
                agreedTerms={agreedTerms}
                onAgreedPolicyChange={setAgreedPolicy}
                onAgreedTermsChange={setAgreedTerms}
                showErrors={showErrors}
                onEditStylist={() => goToStep(1)}
                onEditSchedule={() => goToStep(2)}
              />
            )}
          </section>

          <aside className="lg:sticky lg:top-24">
            <CheckoutSummary
              service={service}
              coverSrc={coverSrc}
              salonName={salonName}
              address={org?.physical_address}
              stylistLabel={stylistLabel}
              startsAt={startsAt}
              displayTz={displayTz}
              quote={quote}
            >
              <div className="hidden gap-2 pt-1 lg:flex">
                {backButton}
                {primaryButton}
              </div>
              {wizardStep === 3 ? (
                <p className="hidden text-center text-[11px] text-stone-400 lg:block">
                  You will approve the hold on PayPal, then return here.
                </p>
              ) : null}
            </CheckoutSummary>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_-16px_rgba(28,25,23,0.25)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-2xl flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-1.5 text-stone-600">
              {selectionLabel ? (
                <>
                  <CalendarCheck2 className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                  <span className="truncate font-medium text-stone-900">{selectionLabel}</span>
                </>
              ) : (
                <>
                  <User className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                  <span className="truncate">{stylistLabel}</span>
                </>
              )}
            </span>
            <span className="shrink-0 text-stone-500">
              Due today <span className="font-semibold text-emerald-700">{formatUsd(0)}</span>
            </span>
          </div>
          <div className="flex gap-2">
            {backButton}
            {primaryButton}
          </div>
        </div>
      </div>
    </div>
  )
}
