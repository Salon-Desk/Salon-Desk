'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'

import { useAuthModal } from '@/components/auth/auth-context'
import { Toast } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useClientStore, useDemoReset, useToast } from '@/hooks'
import { BUYER_PERSONAS, type BuyerPersonaId } from '@/lib/constants'
import { INITIAL_STAFF, stylistForCategory } from '@/lib/data/catalog'
import { DEFAULT_TIME_SLOT } from '@/lib/data/service-content'
import { createIdempotencyKey } from '@/lib/ids'
import {
  mapApiBookingToUi,
  mapCatalogServiceToSalonService,
  slotLabelToIso,
} from '@/lib/mappers/booking'
import { isAuthenticatedSelector, isClientUser, userSelector } from '@/store/authSlice'
import {
  useCancelBookingMutation,
  useCreateBookingConsentMutation,
  useCreateBookingMutation,
  useGetMyBookingsQuery,
} from '@/store/slice/bookingsApi'
import {
  useGetCatalogCategoriesQuery,
  useGetCatalogOrganizationsQuery,
  useGetCatalogServicesQuery,
} from '@/store/slice/catalogApi'
import { useCreatePaymentHoldMutation } from '@/store/slice/paymentsApi'
import type { Booking, SalonService, StaffMember } from '@/types'
import type { CatalogService } from '@/types/api-org'

import { useAiConcierge } from '../_hooks/use-ai-concierge'
import { AiConcierge } from './ai-concierge'
import { BookingsPanel } from './bookings-panel'
import { CatalogFilters, type ServiceSort } from './catalog-filters'
import { CatalogHero } from './catalog-hero'
import { ClientFooter } from './client-footer'
import { ClientHeader, type ClientTab } from './client-header'
import { type AuthStep, PaypalAuthModal } from './paypal-auth-modal'
import { ProtocolModal } from './protocol-modal'
import { ReceiptModal } from './receipt-modal'
import { ServiceCard } from './service-card'

export function ClientExperience() {
  const { resetState } = useClientStore()
  const { isResetting, reset } = useDemoReset(resetState)
  const { message: toastMessage, show: showToast, dismiss } = useToast()
  const concierge = useAiConcierge()
  const { openAuthModal } = useAuthModal()
  const user = useSelector(userSelector)
  const isAuthenticated = useSelector(isAuthenticatedSelector)

  const {
    data: catalogServices = [],
    isLoading: catalogLoading,
    isError: catalogError,
    refetch: refetchCatalog,
  } = useGetCatalogServicesQuery()
  const { data: categories = [] } = useGetCatalogCategoriesQuery()
  const { data: organizations = [] } = useGetCatalogOrganizationsQuery()
  const {
    data: apiBookings = [],
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useGetMyBookingsQuery(undefined, { skip: !isAuthenticated || !isClientUser(user) })

  const [createBooking] = useCreateBookingMutation()
  const [createConsent] = useCreateBookingConsentMutation()
  const [createHold] = useCreatePaymentHoldMutation()
  const [cancelBooking] = useCancelBookingMutation()

  const [activeTab, setActiveTab] = useState<ClientTab>('catalog')
  const [buyerPersona, setBuyerPersona] = useState<BuyerPersonaId>('hana')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<ServiceSort>('popular')

  const [selectedService, setSelectedService] = useState<SalonService | null>(null)
  const [selectedCatalogService, setSelectedCatalogService] = useState<CatalogService | null>(null)
  const [protocolService, setProtocolService] = useState<SalonService | null>(null)
  const [selectedStylist, setSelectedStylist] = useState<StaffMember>(INITIAL_STAFF[0])
  const [selectedSlot, setSelectedSlot] = useState(DEFAULT_TIME_SLOT)
  const [isPayPalOpen, setIsPayPalOpen] = useState(false)
  const [authStep, setAuthStep] = useState<AuthStep>('review')
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null)

  const orgNameById = useMemo(() => {
    const map = new Map<string, string>()
    organizations.forEach((o) => map.set(o.id, o.name))
    return map
  }, [organizations])

  const catalogById = useMemo(() => {
    const map = new Map<string, CatalogService>()
    catalogServices.forEach((s) => map.set(s.id, s))
    return map
  }, [catalogServices])

  const categoryOptions = useMemo(() => {
    const names = categories.map((c) => c.name)
    return ['All', ...(names.length ? names : [])]
  }, [categories])

  const salonServices = useMemo(
    () => catalogServices.map(mapCatalogServiceToSalonService),
    [catalogServices],
  )

  const filteredServices = useMemo(() => {
    return salonServices
      .filter((service) => {
        const matchCategory = selectedCategory === 'All' || service.category === selectedCategory
        const matchSearch =
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description.toLowerCase().includes(searchQuery.toLowerCase())
        return matchCategory && matchSearch
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price
        if (sortBy === 'price-desc') return b.price - a.price
        if (sortBy === 'duration') return a.durationMin - b.durationMin
        if (sortBy === 'popular') return Number(b.popular) - Number(a.popular)
        return 0
      })
  }, [salonServices, selectedCategory, searchQuery, sortBy])

  const uiBookings = useMemo(
    () =>
      apiBookings.map((b) =>
        mapApiBookingToUi(b, {
          clientName:
            user?.name ||
            [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
            user?.email ||
            'You',
          salonName: orgNameById.get(b.org_id) || 'Salon',
          serviceName: 'Service',
          stylistName: 'Stylist',
        }),
      ),
    [apiBookings, orgNameById, user],
  )

  const activeHolds = uiBookings.filter((b) => b.status === 'HELD' || b.status === 'REAUTHORIZED')
  const pastBookings = uiBookings.filter((b) => b.status !== 'HELD' && b.status !== 'REAUTHORIZED')

  const openCheckout = (service: SalonService, stylist?: StaffMember, slot?: string) => {
    if (!isAuthenticated || !isClientUser(user)) {
      openAuthModal('sign-in', 'client')
      showToast('Sign in with a client account to place a PayPal hold.')
      return
    }
    const catalog = catalogById.get(service.id)
    if (!catalog) {
      toast.error('Service is not available from the live catalog', toastColor.error)
      return
    }
    setSelectedService(service)
    setSelectedCatalogService(catalog)
    setSelectedStylist(stylist ?? stylistForCategory(service.category))
    if (slot) setSelectedSlot(slot)
    setAuthStep('review')
    setIsPayPalOpen(true)
  }

  const handleStartBooking = (service: SalonService) => {
    openCheckout(service)
  }

  const handleAskAi = (service: SalonService) => {
    setSelectedService(service)
    concierge.setIsOpen(true)
    concierge.setMode('chat')
    void concierge.send(
      `I'm interested in the "${service.name}". Can you find me the next available time slot and explain the hold policy?`,
      service,
    )
  }

  const handleApproveHold = async () => {
    if (!selectedService || !selectedCatalogService) return
    setAuthStep('authorizing')

    try {
      const startsAt = slotLabelToIso(selectedSlot)
      const booking = await createBooking({
        org_id: selectedCatalogService.organization_id,
        starts_at: startsAt,
        service_ids: [selectedCatalogService.id],
        stylist_id: null,
        customer_notes: `Booked via client portal · ${selectedStylist.name}`,
      }).unwrap()

      const termsText =
        'I authorize SalonDesk / PayPal to place an authorization hold for this appointment. $0 is charged today; settlement occurs at the salon.'
      await createConsent({
        bookingId: booking.id,
        body: {
          terms_version: 'v1',
          terms_text: termsText,
          signed_payload: `${booking.id}:${user?.id || 'client'}:${Date.now()}`,
        },
      }).unwrap()

      await createHold({
        booking_id: booking.id,
        idempotency_key: createIdempotencyKey(booking.id, 'AUTH_INTENT'),
        currency: 'USD',
      }).unwrap()

      const uiBooking = mapApiBookingToUi(booking, {
        clientName:
          user?.name ||
          [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
          BUYER_PERSONAS[buyerPersona].name,
        salonName:
          orgNameById.get(selectedCatalogService.organization_id) ||
          selectedCatalogService.organization_name ||
          'Salon',
        serviceName: selectedService.name,
        stylistName: selectedStylist.name,
      })

      setConfirmedBooking(uiBooking)
      setAuthStep('success')
      void refetchBookings()
      showToast(
        `Appointment confirmed! PayPal authorization hold of $${selectedService.holdDeposit} placed. $0 debited today.`,
      )
    } catch (err) {
      setAuthStep('review')
      const message =
        (err as { data?: { detail?: string } })?.data?.detail ||
        'Could not create booking hold. Please try again.'
      toast.error(String(message), toastColor.error)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBooking({
        bookingId,
        body: { reason: 'Client self-service cancellation' },
      }).unwrap()
      void refetchBookings()
      showToast(`Appointment cancelled. Authorization hold will be released ($0 charged).`)
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not cancel booking'
      toast.error(String(message), toastColor.error)
    }
  }

  const handleReset = async () => {
    await reset()
    showToast('Sandbox successfully reset to pristine demo seed state.')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fbfbfa] font-sans text-stone-900 selection:bg-amber-500/20">
      {toastMessage && <Toast message={toastMessage} onDismiss={dismiss} position="bottom-right" />}

      <ClientHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeHoldsCount={activeHolds.length}
        conciergeOpen={concierge.isOpen}
        onToggleConcierge={() => concierge.setIsOpen((open) => !open)}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-28 md:pb-16">
        {activeTab === 'catalog' ? (
          <div>
            <CatalogHero />
            <CatalogFilters
              category={selectedCategory}
              onCategoryChange={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              categories={categoryOptions}
            />

            {catalogLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-500">
                <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                Loading live catalog…
              </div>
            ) : null}

            {catalogError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
                <p>Could not load the service catalog.</p>
                <button
                  type="button"
                  onClick={() => void refetchCatalog()}
                  className="mt-3 rounded-full bg-stone-950 px-5 py-2 text-xs font-bold text-white"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {!catalogLoading && !catalogError && filteredServices.length === 0 ? (
              <div className="rounded-3xl bg-stone-100/60 p-12 text-center">
                <p className="text-sm font-semibold text-stone-900">
                  No services match your search
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Try adjusting your search query or selecting a different category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All')
                    setSearchQuery('')
                  }}
                  className="mt-4 rounded-full bg-stone-950 px-5 py-2 font-bold text-xs text-white transition-colors hover:bg-stone-800 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : null}

            {!catalogLoading && !catalogError && filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 sm:gap-y-14">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onAskAi={handleAskAi}
                    onQuickBook={handleStartBooking}
                    onOpenProtocol={setProtocolService}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {bookingsLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-500">
                <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                Loading your bookings…
              </div>
            ) : (
              <BookingsPanel
                activeHolds={activeHolds}
                pastBookings={pastBookings}
                onBrowseCatalog={() => setActiveTab('catalog')}
                onCancel={(id) => void handleCancelBooking(id)}
                onViewReceipt={setReceiptBooking}
              />
            )}
          </>
        )}
      </main>

      <ClientFooter
        buyerPersona={buyerPersona}
        onTogglePersona={() =>
          setBuyerPersona((current) => (current === 'hana' ? 'guest' : 'hana'))
        }
        onReset={handleReset}
        isResetting={isResetting}
      />

      <nav
        aria-label="Mobile quick actions"
        className="fixed bottom-4 inset-x-4 z-30 md:hidden flex items-center justify-between gap-1 rounded-full bg-stone-950/90 text-white p-1.5 backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'catalog' ? 'bg-white text-stone-950' : 'text-stone-400 hover:text-white'
          }`}
        >
          <span>Catalog</span>
        </button>

        <button
          type="button"
          onClick={() => concierge.setIsOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-amber-500 text-stone-950 font-bold text-xs cursor-pointer active:scale-95 transition-all"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ask AI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my-bookings')}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'my-bookings'
              ? 'bg-white text-stone-950'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            Bookings
            {activeHolds.length > 0 && (
              <span className="h-4 min-w-4 px-1 rounded-full bg-amber-500 text-stone-950 font-mono text-[9px] font-bold flex items-center justify-center">
                {activeHolds.length}
              </span>
            )}
          </span>
        </button>
      </nav>

      {concierge.isOpen && (
        <AiConcierge
          mode={concierge.mode}
          onModeChange={concierge.setMode}
          prompt={concierge.prompt}
          onPromptChange={concierge.setPrompt}
          isThinking={concierge.isThinking}
          messages={concierge.messages}
          messagesEndRef={concierge.messagesEndRef}
          onSend={concierge.send}
          onAuthorize={({ service, stylist, slot }) => openCheckout(service, stylist, slot)}
          onClose={() => concierge.setIsOpen(false)}
        />
      )}

      {isPayPalOpen && selectedService && (
        <PaypalAuthModal
          service={selectedService}
          stylist={selectedStylist}
          slot={selectedSlot}
          step={authStep}
          confirmedBooking={confirmedBooking}
          buyerPersona={buyerPersona}
          onSelectStylist={setSelectedStylist}
          onSelectSlot={setSelectedSlot}
          onApprove={() => void handleApproveHold()}
          onClose={() => setIsPayPalOpen(false)}
          onViewBookings={() => {
            setIsPayPalOpen(false)
            setActiveTab('my-bookings')
          }}
        />
      )}

      {protocolService && (
        <ProtocolModal
          service={protocolService}
          onClose={() => setProtocolService(null)}
          onBook={(service) => {
            setProtocolService(null)
            handleStartBooking(service)
          }}
        />
      )}

      {receiptBooking && (
        <ReceiptModal booking={receiptBooking} onClose={() => setReceiptBooking(null)} />
      )}
    </div>
  )
}
