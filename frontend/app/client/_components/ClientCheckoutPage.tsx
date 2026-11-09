'use client'

import { AlertTriangle, Loader2, SearchX } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'

import { useAuthModal } from '@/components/auth/auth-context'
import { toastColor } from '@/constant/toast-color'
import { useBookingContext } from '@/hooks'
import { ROUTES } from '@/lib/constants'
import { ANY_AVAILABLE_STYLIST } from '@/lib/data/catalog'
import { createIdempotencyKey } from '@/lib/ids'
import { buildClientOrgStaffQueryArg } from '@/lib/listing-params/client-org-staff-list-params'
import { mapApiBookingToUi, mapCatalogServiceToSalonService } from '@/lib/mappers/booking'
import { mapCatalogStaffToUi } from '@/lib/mappers/staff'
import {
  useCompletePaymentHoldMutation,
  useCreateBookingConsentMutation,
  useCreateBookingMutation,
  useCreatePaymentHoldMutation,
  useGetCatalogOrgStaffQuery,
  useGetCatalogServiceQuery,
  useGetCatalogServicesQuery,
} from '@/store/api/clientApi'
import { useUpdateProfileMutation } from '@/store/api/sharedApi'
import { isAuthenticatedSelector, isClientUser, userSelector } from '@/store/authSlice'
import type { Booking, SalonService, StaffMember } from '@/types'
import type { ApiBooking, PaymentHold } from '@/types/api-booking'

import { CHECKOUT_TERMS_VERSION } from '../_constants/checkout-legal'
import { type AuthStep, PayPalHoldCheckout } from './PayPalHoldCheckout'
import { PayPalSmartHoldButtons, type PrepareHoldResult } from './PayPalSmartHoldButtons'

/** Remembers the checkout URL so a cancelled PayPal approval can land back on it. */
export const LAST_CHECKOUT_STORAGE_KEY = 'salondesk:last-checkout'

export function checkoutPath(serviceId: string, opts: { slot?: string | null; stylist?: string }) {
  const params = new URLSearchParams()
  if (opts.slot) params.set('slot', opts.slot)
  if (opts.stylist) params.set('stylist', opts.stylist)
  const qs = params.toString()
  return `${ROUTES.clientBook}/${serviceId}${qs ? `?${qs}` : ''}`
}

function findStylist(id: string | null | undefined, staff: StaffMember[]): StaffMember {
  if (!id || id === ANY_AVAILABLE_STYLIST.id) return ANY_AVAILABLE_STYLIST
  const query = id.trim().toLowerCase()
  return (
    staff.find(
      (s) =>
        s.id.toLowerCase() === query ||
        s.name.toLowerCase() === query ||
        s.name.toLowerCase().includes(query),
    ) ?? ANY_AVAILABLE_STYLIST
  )
}

export interface ClientCheckoutPageProps {
  serviceId: string
  extraServiceIds?: string[]
  initialSlot?: string
  initialStylistId?: string
  initialPartySize?: number
  paypalCancelled?: boolean
}

export function ClientCheckoutPage({
  serviceId,
  extraServiceIds = [],
  initialSlot,
  initialStylistId,
  initialPartySize = 1,
  paypalCancelled = false,
}: ClientCheckoutPageProps) {
  const router = useRouter()
  const user = useSelector(userSelector)
  const isAuthenticated = useSelector(isAuthenticatedSelector)
  const canCheckout = isAuthenticated && isClientUser(user)
  const { saveDraft, pauseForAuth } = useBookingContext()
  const { openAuthModal } = useAuthModal()

  const { data: catalog, isLoading, isError, refetch } = useGetCatalogServiceQuery(serviceId)
  const orgId = catalog?.organization_id ?? ''
  const { data: orgServicesPage } = useGetCatalogServicesQuery(
    { org_id: orgId, page_size: 100 },
    { skip: !orgId },
  )
  const { data: staffPage, isLoading: staffLoading } = useGetCatalogOrgStaffQuery(
    buildClientOrgStaffQueryArg(orgId),
    {
      skip: !orgId,
    },
  )
  const staffOptions = useMemo(
    () =>
      (staffPage?.items ?? [])
        .map(mapCatalogStaffToUi)
        .filter((s) => !s.role?.toLowerCase().includes('owner')),
    [staffPage?.items],
  )
  const service = useMemo(
    () => (catalog ? mapCatalogServiceToSalonService(catalog) : null),
    [catalog],
  )

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() => {
    const initial = [serviceId, ...(extraServiceIds || [])]
    return Array.from(new Set(initial))
  })

  const availableOrgServices = useMemo(
    () => (orgServicesPage?.items ?? []).map(mapCatalogServiceToSalonService),
    [orgServicesPage?.items],
  )

  const selectedServices = useMemo(() => {
    if (!service) return []
    if (selectedServiceIds.length <= 1) return [service]
    const extras = availableOrgServices.filter(
      (s) => selectedServiceIds.includes(s.id) && s.id !== service.id,
    )
    return [service, ...extras]
  }, [service, selectedServiceIds, availableOrgServices])

  const handleToggleService = (s: SalonService) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(s.id)) {
        if (prev.length <= 1) return prev
        return prev.filter((id) => id !== s.id)
      }
      return [...prev, s.id]
    })
    setStartsAt(null)
  }

  const [pickedStylist, setPickedStylist] = useState<StaffMember>(ANY_AVAILABLE_STYLIST)
  const [serviceStylistMap, setServiceStylistMap] = useState<Record<string, StaffMember>>({})
  const [startsAt, setStartsAt] = useState<string | null>(() =>
    initialSlot && !Number.isNaN(Date.parse(initialSlot)) ? initialSlot : null,
  )
  const [partySize, setPartySize] = useState<number>(() => Math.max(1, initialPartySize ?? 1))
  const [clientPhone, setClientPhone] = useState<string>(
    () => user?.profile?.phone || user?.phone || '',
  )
  const [step, setStep] = useState<AuthStep>('review')
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)
  const [activeBooking, setActiveBooking] = useState<ApiBooking | null>(null)

  const [createBooking] = useCreateBookingMutation()
  const [createConsent] = useCreateBookingConsentMutation()
  const [createHold] = useCreatePaymentHoldMutation()
  const [completeHold] = useCompletePaymentHoldMutation()
  const [updateProfile] = useUpdateProfileMutation()

  const holdAmountEstimate = useMemo(() => {
    const baseServicePrice = selectedServices.reduce((sum, s) => sum + s.price, 0)
    return baseServicePrice * Math.max(1, partySize)
  }, [selectedServices, partySize])

  const stylist = pickedStylist

  const handleSelectServiceStylist = (serviceId: string, s: StaffMember) => {
    setServiceStylistMap((prev) => ({
      ...prev,
      [serviceId]: s,
    }))
    setStartsAt(null)
  }

  const handleApplyStylistToAll = (s: StaffMember) => {
    setPickedStylist(s)
    const newMap: Record<string, StaffMember> = {}
    for (const svc of selectedServices) {
      newMap[svc.id] = s
    }
    setServiceStylistMap(newMap)
    setStartsAt(null)
  }

  useEffect(() => {
    if (user?.profile?.phone && !clientPhone) {
      setClientPhone(user.profile.phone)
    } else if (user?.phone && !clientPhone) {
      setClientPhone(user.phone)
    }
  }, [user?.profile?.phone, user?.phone, clientPhone])

  const phoneDigits = (clientPhone ?? '').replace(/\D/g, '')
  const phoneError = !phoneDigits
    ? 'Phone number is required for booking'
    : phoneDigits.length < 8 || phoneDigits.length > 15
      ? 'Please enter a valid phone number'
      : undefined

  useEffect(() => {
    if (!initialStylistId) return
    setPickedStylist(findStylist(initialStylistId, staffOptions))
  }, [initialStylistId, staffOptions])

  const prepareBookingAndHold = async (): Promise<{
    booking: ApiBooking
    hold: PaymentHold
  } | null> => {
    if (!catalog || !service || !startsAt) {
      toast.error('Select an available day and time slot first', toastColor.error)
      return null
    }

    if (new Date(startsAt).getTime() <= Date.now()) {
      toast.error(
        'Selected slot has already passed. Please choose a future slot.',
        toastColor.error,
      )
      setStartsAt(null)
      return null
    }

    const maxBookingDate = new Date(Date.now() + 28 * 86400000)
    if (new Date(startsAt).getTime() > maxBookingDate.getTime()) {
      toast.error(
        'Appointments with PayPal deposit holds can only be scheduled up to 28 days in advance.',
        toastColor.error,
      )
      setStartsAt(null)
      return null
    }

    if (phoneError || !clientPhone.trim()) {
      toast.error('Please enter a valid phone number before proceeding', toastColor.error)
      return null
    }

    if (partySize < 1 || partySize > 10) {
      toast.error('Party size must be between 1 and 10 guests', toastColor.error)
      return null
    }

    const allServiceIds = selectedServices.map((s) => s.id)
    const returnPath = checkoutPath(serviceId, { slot: startsAt, stylist: stylist.id })
    if (!canCheckout) {
      saveDraft({
        orgId: catalog.organization_id,
        serviceIds: allServiceIds,
        startsAt,
        stylistId: stylist.id,
        selectedServiceName:
          selectedServices.length > 1
            ? `${service.name} (+${selectedServices.length - 1} more)`
            : service.name,
      })
      pauseForAuth(returnPath)
      openAuthModal('sign-in', 'client')
      toast.info('Sign in to authorize your hold — your selection is saved.', toastColor.info)
      return null
    }

    if (!user?.profile?.phone && clientPhone.trim()) {
      void updateProfile({ phone: clientPhone.trim() })
    }

    setStep('authorizing')
    try {
      const serviceStylistsPayload = selectedServices.map((s) => {
        const st = serviceStylistMap[s.id] ?? pickedStylist
        return {
          service_id: s.id,
          stylist_id: !st || st.id === ANY_AVAILABLE_STYLIST.id ? null : st.id,
        }
      })

      const primaryStylist = serviceStylistMap[service.id] ?? pickedStylist
      const primaryStylistId =
        !primaryStylist || primaryStylist.id === ANY_AVAILABLE_STYLIST.id ? null : primaryStylist.id

      const stylistSummary = selectedServices
        .map((s) => {
          const st = serviceStylistMap[s.id] ?? pickedStylist
          return `${s.name}: ${!st || st.id === ANY_AVAILABLE_STYLIST.id ? 'Any available' : st.name}`
        })
        .join(' · ')

      const booking = await createBooking({
        org_id: catalog.organization_id,
        starts_at: startsAt,
        service_ids: allServiceIds,
        service_stylists: serviceStylistsPayload,
        party_size: partySize,
        stylist_id: primaryStylistId,
        customer_notes: [
          partySize > 1 ? `Party of ${partySize} guests (family / group)` : null,
          `Client Phone: ${clientPhone.trim()}`,
          selectedServices.length > 1
            ? `Stylists: ${stylistSummary}`
            : `Stylist: ${primaryStylist.name}`,
          selectedServices.length > 1
            ? `Services: ${selectedServices.map((s) => s.name).join(', ')}`
            : null,
        ]
          .filter(Boolean)
          .join(' · '),
      }).unwrap()

      const holdAmount = Number(booking.agreed_hold_amount ?? booking.total_price) || 0
      const noShowFee = Number(booking.agreed_no_show_fee ?? 0)
      const freeCancel = booking.free_cancel_deadline_at
        ? new Date(booking.free_cancel_deadline_at).toLocaleString()
        : 'the free-cancel deadline'
      const termsText = `I agree to the SalonDesk Terms of Service, Privacy Policy, and the salon cancellation policy. I authorize SalonDesk / PayPal to place an authorization hold of $${holdAmount.toFixed(2)} for this appointment. $0 is charged today. Free cancellation until ${freeCancel}. Agreed no-show fee: $${noShowFee.toFixed(2)}. Settlement uses the locked booking-time price and policy snapshot.`
      await createConsent({
        bookingId: booking.id,
        body: {
          terms_version: CHECKOUT_TERMS_VERSION,
          terms_text: termsText,
          signed_payload: `${booking.id}:${user?.id || 'client'}:${Date.now()}`,
        },
      }).unwrap()

      const hold = await createHold({
        booking_id: booking.id,
        idempotency_key: createIdempotencyKey(booking.id, 'AUTH_INTENT'),
        currency: 'USD',
      }).unwrap()

      setActiveBooking(booking)
      return { booking, hold }
    } catch (err: unknown) {
      setStep('review')
      const errorObj = err as {
        status?: number
        data?: { detail?: string | { msg?: string }[] }
      }
      let message = 'Could not create booking hold. Please try again.'
      if (typeof errorObj?.data?.detail === 'string') {
        message = errorObj.data.detail
      } else if (Array.isArray(errorObj?.data?.detail) && errorObj.data.detail[0]?.msg) {
        message = errorObj.data.detail[0].msg
      }

      if (
        errorObj?.status === 409 ||
        message.toLowerCase().includes('not available') ||
        message.toLowerCase().includes('conflict')
      ) {
        toast.error(
          'This time slot is no longer available. Please select another time.',
          toastColor.error,
        )
        setStartsAt(null)
      } else {
        toast.error(message, toastColor.error)
      }
      return null
    }
  }

  const handleFallbackRedirect = (approvalUrl: string) => {
    setStep('awaiting_paypal')
    const returnPath = checkoutPath(serviceId, { slot: startsAt, stylist: stylist.id })
    try {
      window.sessionStorage.setItem(LAST_CHECKOUT_STORAGE_KEY, returnPath)
    } catch {
      // Storage unavailable in private browsing
    }
    window.location.assign(approvalUrl)
  }

  const handleSmartPrepareHold = async (): Promise<PrepareHoldResult | null> => {
    const res = await prepareBookingAndHold()
    if (!res) return null
    return {
      holdId: res.hold.id,
      paypalOrderId: res.hold.paypal_order_id || res.hold.id,
      approvalUrl: res.hold.approval_url || '',
    }
  }

  const handleSmartCompleteHold = async (holdId: string, orderToken: string): Promise<void> => {
    const completed = await completeHold({
      holdId,
      body: { paypal_order_token: orderToken },
    }).unwrap()

    const targetBooking = activeBooking
    if (!targetBooking) return

    setConfirmedBooking(
      mapApiBookingToUi(targetBooking, {
        clientName:
          user?.name ||
          [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
          user?.email ||
          'You',
        salonName: catalog?.organization_name || 'Salon',
        serviceName: service?.name || catalog?.name || 'Service',
        stylistName: stylist?.name || 'Stylist',
        paypalAuthId: completed.latest_authorization_id || completed.parent_authorization_id,
        honorExpiresAt: completed.honor_expires_at,
        reauthorizationCount: completed.reauthorization_count,
        holdStatus: completed.status,
      }),
    )
    setStep('success')
    const holdAmount = Number(targetBooking.agreed_hold_amount ?? targetBooking.total_price) || 0
    toast.success(
      `Booking confirmed with a PayPal hold of $${holdAmount.toFixed(2)}. $0 charged today.`,
      toastColor.success,
    )
  }

  const handleApprove = async () => {
    const res = await prepareBookingAndHold()
    if (!res) return

    if (res.hold.approval_url && res.hold.status === 'PENDING') {
      handleFallbackRedirect(res.hold.approval_url)
      return
    }

    setConfirmedBooking(
      mapApiBookingToUi(res.booking, {
        clientName:
          user?.name ||
          [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
          user?.email ||
          'You',
        salonName: catalog?.organization_name || 'Salon',
        serviceName: service?.name || catalog?.name || 'Service',
        stylistName: stylist?.name || 'Stylist',
        paypalAuthId: res.hold.latest_authorization_id || res.hold.parent_authorization_id,
        honorExpiresAt: res.hold.honor_expires_at,
        reauthorizationCount: res.hold.reauthorization_count,
        holdStatus: res.hold.status,
      }),
    )
    setStep('success')
    const holdAmount = Number(res.booking.agreed_hold_amount ?? res.booking.total_price) || 0
    toast.success(
      `Booking confirmed with a PayPal hold of $${holdAmount.toFixed(2)}. $0 charged today.`,
      toastColor.success,
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#fbfbfa]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <p className="text-xs text-stone-500">Loading service…</p>
      </div>
    )
  }

  if (isError || !service) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#fbfbfa] px-4">
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <SearchX className="mx-auto mb-4 h-10 w-10 text-stone-300" />
          <h1 className="font-serif text-2xl text-stone-950">Service unavailable</h1>
          <p className="mt-2 text-sm text-stone-500">
            This service is no longer in the live catalog, or could not be loaded.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-full border border-stone-200 px-5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Retry
            </button>
            <Link
              href={ROUTES.client}
              className="rounded-full bg-stone-950 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800"
            >
              Browse services
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PayPalHoldCheckout
      service={service}
      services={selectedServices}
      availableOrgServices={availableOrgServices}
      onToggleService={handleToggleService}
      stylist={stylist}
      serviceStylistMap={serviceStylistMap}
      onSelectServiceStylist={handleSelectServiceStylist}
      onApplyStylistToAll={handleApplyStylistToAll}
      staffOptions={staffOptions}
      staffLoading={staffLoading}
      startsAt={startsAt}
      step={step}
      confirmedBooking={confirmedBooking}
      initialWizardStep={startsAt ? 3 : 1}
      partySize={partySize}
      onPartySizeChange={setPartySize}
      clientPhone={clientPhone}
      onClientPhoneChange={setClientPhone}
      phoneError={phoneError}
      smartButtons={
        <PayPalSmartHoldButtons
          holdAmount={holdAmountEstimate}
          disabled={!canCheckout || Boolean(phoneError) || !clientPhone.trim()}
          onPrepareHold={handleSmartPrepareHold}
          onCompleteHold={handleSmartCompleteHold}
          onFallbackRedirect={handleFallbackRedirect}
        />
      }
      notice={
        paypalCancelled ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              PayPal approval was cancelled, so no hold was placed. Review your details and try
              again when you are ready.
            </p>
          </div>
        ) : !canCheckout ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                Booking as guest. You can configure your services, stylist, and time below, and sign
                in when authorizing hold.
              </span>
            </div>
            <button
              type="button"
              onClick={() => openAuthModal('sign-in', 'client')}
              className="self-start sm:self-auto shrink-0 font-semibold text-amber-900 underline hover:text-amber-700 cursor-pointer"
            >
              Sign in now
            </button>
          </div>
        ) : null
      }
      onSelectStylist={setPickedStylist}
      onSelectStartsAt={setStartsAt}
      onApprove={() => void handleApprove()}
      onExit={() => router.push(ROUTES.client)}
      onViewBookings={() => router.push(ROUTES.clientBookings)}
    />
  )
}
