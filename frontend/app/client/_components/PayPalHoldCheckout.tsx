'use client'

import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Info,
  Lock,
  MapPin,
  Sparkles,
  User,
} from 'lucide-react'
import Image from 'next/image'
import { type ReactNode, useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/button'
import { ANY_AVAILABLE_STYLIST } from '@/lib/data/catalog'
import { serviceImage } from '@/lib/data/service-content'
import { formatDuration, formatUsd } from '@/lib/format'
import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'
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

import { CheckoutGuestServiceSelection } from './CheckoutGuestServiceSelection'
import { CheckoutReview } from './CheckoutReview'
import { CheckoutSchedule } from './CheckoutSchedule'
import { CheckoutHeader, CheckoutPendingView, CheckoutSuccessView } from './CheckoutStatusViews'
import { BookingStepper, type CheckoutWizardStep } from './CheckoutStepper'
import { buildCheckoutQuote, CheckoutSummary } from './CheckoutSummary'
import { MultiServiceStylistPicker } from './MultiServiceStylistPicker'
import { ServiceDetailModal } from './ServiceDetailModal'
import { ServiceSelectionModal } from './ServiceSelectionModal'

export type AuthStep = 'review' | 'authorizing' | 'awaiting_paypal' | 'success'

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

export interface PayPalHoldCheckoutProps {
  service: SalonService
  services?: SalonService[]
  availableOrgServices?: SalonService[]
  onToggleService?: (service: SalonService) => void
  stylist: StaffMember
  serviceStylistMap?: Record<string, StaffMember>
  onSelectServiceStylist?: (serviceId: string, stylist: StaffMember) => void
  onApplyStylistToAll?: (stylist: StaffMember) => void
  staffOptions: StaffMember[]
  staffLoading?: boolean
  startsAt: string | null
  step: AuthStep
  confirmedBooking: Booking | null
  initialWizardStep?: CheckoutWizardStep
  partySize?: number
  onPartySizeChange?: (size: number) => void
  clientPhone?: string
  onClientPhoneChange?: (phone: string) => void
  phoneError?: string
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
  services,
  availableOrgServices,
  onToggleService,
  stylist,
  serviceStylistMap,
  onSelectServiceStylist,
  onApplyStylistToAll,
  staffOptions,
  staffLoading = false,
  startsAt,
  step,
  confirmedBooking,
  initialWizardStep = 1,
  partySize = 1,
  onPartySizeChange,
  clientPhone,
  onClientPhoneChange,
  phoneError,
  notice,
  onSelectStylist,
  onSelectStartsAt,
  onApprove,
  onExit,
  onViewBookings,
}: PayPalHoldCheckoutProps) {
  const allServices = services && services.length > 0 ? services : [service]
  const totalDurationMin = allServices.reduce((acc, s) => acc + s.durationMin, 0)
  const totalPrice = allServices.reduce((acc, s) => acc + s.price, 0)
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
    initialWizardStep === 4 && !startsAt ? 3 : initialWizardStep,
  )
  const [agreedPolicy, setAgreedPolicy] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)

  const quote = buildCheckoutQuote(allServices, policy, startsAt, partySize)
  const stylistLabel =
    stylist.id === ANY_AVAILABLE_STYLIST.id ? 'Any available stylist' : stylist.name

  const stylistSubtitle = useMemo(() => {
    if (allServices.length > 1 && serviceStylistMap) {
      const distinct = new Set(Object.values(serviceStylistMap).map((s) => s.id))
      return `${distinct.size} stylist${distinct.size > 1 ? 's' : ''} assigned`
    }
    return stylistLabel
  }, [allServices.length, serviceStylistMap, stylistLabel])

  const guestsSubtitle = `${partySize} guest${partySize > 1 ? 's' : ''} · ${allServices.length} svc`

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
  const canContinue =
    wizardStep === 1
      ? allServices.length > 0 && partySize >= 1
      : wizardStep === 2
        ? true
        : wizardStep === 3
          ? Boolean(startsAt)
          : true

  const handlePrimary = () => {
    if (wizardStep < 4) {
      if (canContinue) goToStep((wizardStep + 1) as CheckoutWizardStep)
      return
    }
    if (!startsAt) {
      goToStep(3)
      return
    }
    if (!agreed || Boolean(phoneError) || !clientPhone?.trim()) {
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
    wizardStep === 4
      ? 'Continue to PayPal'
      : wizardStep === 3
        ? 'Review booking'
        : wizardStep === 2
          ? 'Choose date & time'
          : 'Continue to stylists'

  const primaryButton = (
    <PrimaryButton
      variant={wizardStep === 4 ? 'paypal' : 'dark'}
      size="sm"
      className={cn(
        'h-12 flex-1 rounded-full text-sm font-semibold transition-all shadow-sm active:scale-[0.99] cursor-pointer',
        wizardStep === 4
          ? 'bg-[#FFC439] hover:bg-[#F4B41A] text-[#003087]'
          : 'bg-stone-950 hover:bg-stone-800 text-white',
      )}
      isDisabled={wizardStep < 4 && !canContinue}
      onClick={handlePrimary}
      fullWidth
    >
      <span className="flex items-center justify-center gap-2">
        {wizardStep === 4 ? <Lock className="h-4 w-4 shrink-0 text-[#003087]" /> : null}
        <span>{primaryLabel}</span>
        {wizardStep < 4 ? <ArrowRight className="h-4 w-4 shrink-0" /> : null}
      </span>
    </PrimaryButton>
  )

  const backButton = (
    <PrimaryButton
      variant="secondary"
      size="sm"
      className="h-12 shrink-0 rounded-full border border-stone-200 bg-stone-100 px-5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-200 hover:text-stone-950 active:scale-[0.99] cursor-pointer"
      onClick={handleBack}
      fullWidth={false}
    >
      <span className="flex items-center justify-center gap-1.5">
        <ArrowLeft className="h-4 w-4 shrink-0" />
        <span>{wizardStep > 1 ? 'Back' : 'Cancel'}</span>
      </span>
    </PrimaryButton>
  )

  if (step === 'authorizing' || step === 'awaiting_paypal') {
    return (
      <CheckoutPendingView
        step={step}
        service={service}
        salonName={salonName}
        selectionLabel={selectionLabel}
        onExit={onExit}
      />
    )
  }

  if (step === 'success' && confirmedBooking) {
    return (
      <CheckoutSuccessView
        confirmedBooking={confirmedBooking}
        onExit={onExit}
        onViewBookings={onViewBookings}
      />
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
              unoptimized={shouldUnoptimizedImage(coverSrc)}
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
              Book appointment
            </p>
            <h1 className="truncate font-serif text-2xl text-stone-950 sm:text-3xl">
              {allServices.length > 1
                ? `${service.name} + ${allServices.length - 1} more`
                : service.name}
            </h1>
            <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-stone-500 sm:text-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
              <span className="truncate">
                {[salonName, org?.physical_address].filter(Boolean).join(' · ') || 'Salon'}
              </span>
              <span className="shrink-0">
                · {formatDuration(totalDurationMin)} · {formatUsd(totalPrice)}
              </span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDetailOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700 shadow-2xs hover:border-amber-400 hover:bg-amber-50/40 transition-colors"
              >
                <Info className="h-3.5 w-3.5 text-amber-700" />
                <span>About Service &amp; Reviews</span>
              </button>

              {availableOrgServices && availableOrgServices.length > 1 && onToggleService && (
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(true)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/80 px-3 py-1 text-xs font-semibold text-amber-900 shadow-2xs hover:bg-amber-100 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>
                    {allServices.length > 1
                      ? `Services (${allServices.length}) · Add / Remove`
                      : '+ Add More Services'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-stone-200 bg-white px-4 py-4 sm:px-6">
          <BookingStepper
            current={wizardStep}
            subtitles={{
              1: guestsSubtitle,
              2: stylistSubtitle,
              3: selectionLabel,
              4: '$0 today',
            }}
            onStepClick={goToStep}
          />
        </div>

        {notice ? <div className="mb-6">{notice}</div> : null}

        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          <section className="min-w-0">
            {wizardStep === 1 && (
              <CheckoutGuestServiceSelection
                partySize={partySize}
                onPartySizeChange={onPartySizeChange ?? (() => {})}
                services={allServices}
                onOpenServiceModal={
                  availableOrgServices && availableOrgServices.length > 1 && onToggleService
                    ? () => setIsServiceModalOpen(true)
                    : undefined
                }
                onRemoveService={onToggleService}
              />
            )}
            {wizardStep === 2 && (
              <MultiServiceStylistPicker
                services={allServices}
                serviceStylistMap={serviceStylistMap ?? { [service.id]: stylist }}
                onSelectServiceStylist={onSelectServiceStylist ?? ((_, s) => onSelectStylist(s))}
                onApplyStylistToAll={onApplyStylistToAll ?? onSelectStylist}
                staffOptions={staffOptions}
                isLoading={staffLoading}
              />
            )}
            {wizardStep === 3 && (
              <CheckoutSchedule
                serviceId={service.id}
                durationMin={totalDurationMin}
                stylistId={stylist.id === ANY_AVAILABLE_STYLIST.id ? null : stylist.id}
                stylistName={stylistLabel}
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
            {wizardStep === 4 && (
              <CheckoutReview
                serviceName={
                  allServices.length > 1
                    ? `${service.name} (+${allServices.length - 1} additional)`
                    : service.name
                }
                services={allServices}
                serviceStylistMap={serviceStylistMap}
                salonName={salonName}
                stylistLabel={stylistLabel}
                startsAt={startsAt}
                durationMin={totalDurationMin}
                displayTz={displayTz}
                quote={quote}
                agreedPolicy={agreedPolicy}
                agreedTerms={agreedTerms}
                onAgreedPolicyChange={setAgreedPolicy}
                onAgreedTermsChange={setAgreedTerms}
                showErrors={showErrors}
                onEditGuestsServices={() => goToStep(1)}
                onEditStylist={() => goToStep(2)}
                onEditSchedule={() => goToStep(3)}
                partySize={partySize}
                onPartySizeChange={onPartySizeChange}
                clientPhone={clientPhone}
                onClientPhoneChange={onClientPhoneChange}
                phoneError={phoneError}
              />
            )}
          </section>

          <aside className="lg:sticky lg:top-24">
            <CheckoutSummary
              service={service}
              services={allServices}
              coverSrc={coverSrc}
              salonName={salonName}
              orgId={orgId ?? undefined}
              address={org?.physical_address}
              stylistLabel={stylistLabel}
              startsAt={startsAt}
              displayTz={displayTz}
              quote={quote}
              partySize={partySize}
              onOpenDetails={() => setIsDetailOpen(true)}
            >
              <div className="hidden items-center gap-2.5 pt-2 lg:flex">
                {backButton}
                {primaryButton}
              </div>
              {wizardStep === 4 ? (
                <p className="hidden text-center text-[11px] text-stone-400 lg:block">
                  You will approve the hold on PayPal, then return here.
                </p>
              ) : null}
            </CheckoutSummary>
          </aside>
        </div>
      </main>

      <ServiceDetailModal
        service={service}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {availableOrgServices && onToggleService && (
        <ServiceSelectionModal
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
          availableServices={availableOrgServices}
          selectedServices={allServices}
          onToggleService={onToggleService}
        />
      )}

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
