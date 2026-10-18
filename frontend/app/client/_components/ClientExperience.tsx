'use client'

import { Calendar, Loader2, MapPin, Search, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'

import { EmptyState, Toast } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useBookingContext, useGeolocation, useToast } from '@/hooks'
import { useAiConcierge } from '@/hooks/use-ai-concierge'
import { useDebounce } from '@/hooks/use-debounce'
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
import { bookingDraftSelector } from '@/store/bookingDraftSlice'
import {
  useCancelBookingMutation,
  useCreateBookingConsentMutation,
  useCreateBookingMutation,
  useGetMyBookingsQuery,
} from '@/store/slice/bookingsApi'
import {
  useGetCatalogCategoriesQuery,
  useGetCatalogHeroQuery,
  useGetCatalogOrganizationsQuery,
  useLazyGetCatalogServiceQuery,
} from '@/store/slice/catalogApi'
import { useCreatePaymentHoldMutation } from '@/store/slice/paymentsApi'
import type { Booking, SalonService, StaffMember } from '@/types'
import type { CatalogService, CatalogServiceSort } from '@/types/api-org'

import { usePagedCatalog } from '../_hooks/use-paged-catalog'
import { BookingReceipt as ReceiptModal } from './BookingReceipt'
import { BookingsPanel } from './BookingsPanel'
import { CatalogFilters, type ServiceSort } from './CatalogFilters'
import { CatalogHero } from './CatalogHero'
import { CatalogSection } from './CatalogSection'
import { ClientFooter } from './ClientFooter'
import { ClientHeader, type ClientTab } from './ClientHeader'
import { AiConcierge } from './ConciergeDrawer'
import { type AuthStep, PaypalAuthModal } from './PayPalHoldCheckout'
import { ProtocolModal } from './ProtocolModal'
import { ServiceCard } from './ServiceCard'

const PAGE_SIZE = 6
const NEARBY_RADIUS_KM = 15

function toApiSort(sort: ServiceSort, mode: 'browse' | 'results'): CatalogServiceSort {
  if (sort === 'price-asc') return 'price_asc'
  if (sort === 'price-desc') return 'price_desc'
  if (sort === 'duration') return 'duration'
  if (sort === 'popular') return mode === 'browse' ? 'name' : 'popular'
  return 'name'
}

export interface ClientExperienceProps {
  initialTab?: ClientTab
  filterOrgId?: string
  resumeCheckoutFromDraft?: boolean
}

export function ClientExperience({
  initialTab = 'catalog',
  filterOrgId,
  resumeCheckoutFromDraft = false,
}: ClientExperienceProps) {
  const router = useRouter()
  const { saveDraft, pauseForAuth } = useBookingContext()
  const bookingDraft = useSelector(bookingDraftSelector)
  const { message: toastMessage, show: showToast, dismiss } = useToast()
  const concierge = useAiConcierge()
  const user = useSelector(userSelector)
  const isAuthenticated = useSelector(isAuthenticatedSelector)
  const {
    coords: userCoords,
    status: geoStatus,
    request: requestLocation,
  } = useGeolocation({ requestOnMount: !filterOrgId })

  const { data: hero, isLoading: heroLoading } = useGetCatalogHeroQuery()
  const { data: categoriesData } = useGetCatalogCategoriesQuery()
  const { data: organizationsData } = useGetCatalogOrganizationsQuery()
  const categories = categoriesData?.items ?? []
  const organizations = organizationsData?.items ?? []
  const [fetchCatalogService] = useLazyGetCatalogServiceQuery()
  const {
    data: apiBookingsData,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useGetMyBookingsQuery(undefined, { skip: !isAuthenticated || !isClientUser(user) })
  const apiBookings = apiBookingsData?.items ?? []

  const [createBooking] = useCreateBookingMutation()
  const [createConsent] = useCreateBookingConsentMutation()
  const [createHold] = useCreatePaymentHoldMutation()
  const [cancelBooking] = useCancelBookingMutation()

  const [activeTab, setActiveTab] = useState<ClientTab>(initialTab)
  const [buyerPersona] = useState<BuyerPersonaId>('hana')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedOrgId, setSelectedOrgId] = useState(filterOrgId ?? '')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<ServiceSort>('popular')
  const debouncedSearch = useDebounce(searchQuery.trim(), 300)

  useEffect(() => {
    setSelectedOrgId(filterOrgId ?? '')
  }, [filterOrgId])

  const [selectedService, setSelectedService] = useState<SalonService | null>(null)
  const [selectedCatalogService, setSelectedCatalogService] = useState<CatalogService | null>(null)
  const [protocolService, setProtocolService] = useState<SalonService | null>(null)
  const [selectedStylist, setSelectedStylist] = useState<StaffMember>(INITIAL_STAFF[0])
  const [selectedSlot, setSelectedSlot] = useState(DEFAULT_TIME_SLOT)
  const [isPayPalOpen, setIsPayPalOpen] = useState(false)
  const [authStep, setAuthStep] = useState<AuthStep>('review')
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null)
  const [isInputFocused, setIsInputFocused] = useState(false)

  // Detect mobile virtual keyboard / input focus so bottom navigation doesn't obstruct form controls
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
        setIsInputFocused(true)
      }
    }
    const handleFocusOut = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
        setIsInputFocused(false)
      }
    }
    window.addEventListener('focusin', handleFocusIn)
    window.addEventListener('focusout', handleFocusOut)
    return () => {
      window.removeEventListener('focusin', handleFocusIn)
      window.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  const categoryId = useMemo(() => {
    if (selectedCategory === 'All') return undefined
    return categories.find((c) => c.name === selectedCategory)?.id
  }, [categories, selectedCategory])

  const categoryOptions = useMemo(() => {
    const names = categories.map((c) => c.name)
    return ['All', ...names]
  }, [categories])

  const effectiveOrgId = filterOrgId || selectedOrgId || undefined

  const isFilteredView =
    Boolean(effectiveOrgId) || selectedCategory !== 'All' || debouncedSearch.length > 0

  const sharedFilters = useMemo(
    () => ({
      ...(categoryId ? { category_id: categoryId } : {}),
      ...(effectiveOrgId ? { org_id: effectiveOrgId } : {}),
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
    }),
    [categoryId, effectiveOrgId, debouncedSearch],
  )

  const nearbyFilters = useMemo(() => {
    if (!userCoords) {
      return {
        ...sharedFilters,
        sort: 'distance' as const,
        max_distance_km: NEARBY_RADIUS_KM,
      }
    }
    return {
      ...sharedFilters,
      sort: 'distance' as const,
      lat: userCoords.lat,
      lng: userCoords.lng,
      max_distance_km: NEARBY_RADIUS_KM,
    }
  }, [sharedFilters, userCoords])

  const popularFilters = useMemo(
    () => ({
      ...sharedFilters,
      sort: 'popular' as const,
    }),
    [sharedFilters],
  )

  const browseFilters = useMemo(
    () => ({
      ...sharedFilters,
      sort: toApiSort(sortBy, 'browse'),
    }),
    [sharedFilters, sortBy],
  )

  const resultsFilters = useMemo(
    () => ({
      ...sharedFilters,
      sort: toApiSort(sortBy, 'results'),
    }),
    [sharedFilters, sortBy],
  )

  const nearby = usePagedCatalog(nearbyFilters, {
    pageSize: PAGE_SIZE,
    skip: isFilteredView || !userCoords,
  })
  const popular = usePagedCatalog(popularFilters, {
    pageSize: PAGE_SIZE,
    skip: isFilteredView,
  })
  const browse = usePagedCatalog(browseFilters, {
    pageSize: PAGE_SIZE,
    skip: isFilteredView,
  })
  const results = usePagedCatalog(resultsFilters, {
    pageSize: PAGE_SIZE,
    skip: !isFilteredView,
  })

  const orgNameById = useMemo(() => {
    const map = new Map<string, string>()
    organizations.forEach((o) => map.set(o.id, o.name))
    return map
  }, [organizations])

  const catalogById = useMemo(() => {
    const map = new Map<string, CatalogService>()
    ;[nearby, popular, browse, results].forEach((section) => {
      section.items.forEach((s) => map.set(s.id, s))
    })
    return map
  }, [nearby.items, popular.items, browse.items, results.items])

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    if (!resumeCheckoutFromDraft || !isAuthenticated || !isClientUser(user)) return
    const serviceId = bookingDraft.serviceIds[0]
    if (!serviceId || isPayPalOpen) return

    const openFromCatalog = (catalog: CatalogService) => {
      const service = mapCatalogServiceToSalonService(catalog)
      setSelectedService(service)
      setSelectedCatalogService(catalog)
      setSelectedStylist(stylistForCategory(service.category))
      if (bookingDraft.startsAt) setSelectedSlot(bookingDraft.startsAt)
      setAuthStep('review')
      setIsPayPalOpen(true)
    }

    const cached = catalogById.get(serviceId)
    if (cached) {
      openFromCatalog(cached)
      return
    }

    void fetchCatalogService(serviceId)
      .unwrap()
      .then(openFromCatalog)
      .catch(() => {
        toast.error('Could not restore your booking draft', toastColor.error)
      })
  }, [
    resumeCheckoutFromDraft,
    isAuthenticated,
    user,
    bookingDraft.serviceIds,
    bookingDraft.startsAt,
    catalogById,
    isPayPalOpen,
    fetchCatalogService,
  ])

  const uiBookings = useMemo(
    () =>
      apiBookings.map((b) =>
        mapApiBookingToUi(b, {
          clientName:
            user?.name ||
            [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
            user?.email ||
            'You',
          salonName: orgNameById.get(b.org_id) || b.organization_name || undefined,
        }),
      ),
    [apiBookings, orgNameById, user],
  )

  const activeHolds = uiBookings.filter((b) => b.status === 'HELD' || b.status === 'REAUTHORIZED')
  const pastBookings = uiBookings.filter((b) => b.status !== 'HELD' && b.status !== 'REAUTHORIZED')

  const resolveCatalog = async (service: SalonService): Promise<CatalogService | null> => {
    const cached = catalogById.get(service.id)
    if (cached) return cached
    try {
      return await fetchCatalogService(service.id).unwrap()
    } catch {
      return null
    }
  }

  const openCheckout = async (service: SalonService, stylist?: StaffMember, slot?: string) => {
    const catalog = await resolveCatalog(service)
    if (!catalog) {
      toast.error('Service is not available from the live catalog', toastColor.error)
      return
    }
    if (!isAuthenticated || !isClientUser(user)) {
      saveDraft({
        orgId: catalog.organization_id,
        serviceIds: [catalog.id],
        startsAt: slot ?? null,
        selectedServiceName: service.name,
      })
      pauseForAuth('/client/book')
      router.push('/client/book')
      showToast('Sign in to continue checkout — your selection is saved.')
      return
    }
    setSelectedService({
      ...service,
      organizationId: catalog.organization_id || service.organizationId,
      organizationName: catalog.organization_name || service.organizationName,
    })
    setSelectedCatalogService(catalog)
    setSelectedStylist(stylist ?? stylistForCategory(service.category))
    if (slot) setSelectedSlot(slot)
    setAuthStep('review')
    setIsPayPalOpen(true)
  }

  const handleStartBooking = (service: SalonService) => {
    void openCheckout(service)
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

  const catalogError = isFilteredView
    ? results.isError
    : popular.isError || browse.isError || (userCoords ? nearby.isError : false)

  const refetchCatalog = () => {
    if (isFilteredView) {
      void results.refetch()
      return
    }
    void popular.refetch()
    void browse.refetch()
    if (userCoords) void nearby.refetch()
  }

  const renderCards = (services: SalonService[]) =>
    services.map((service) => (
      <ServiceCard
        key={service.id}
        service={service}
        onAskAi={handleAskAi}
        onQuickBook={handleStartBooking}
        onOpenProtocol={setProtocolService}
      />
    ))

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-[#fbfbfa] font-sans text-stone-900 selection:bg-amber-500/20">
      {toastMessage && <Toast message={toastMessage} onDismiss={dismiss} position="bottom-right" />}

      <ClientHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeHoldsCount={activeHolds.length}
        conciergeOpen={concierge.isOpen}
        onToggleConcierge={() => concierge.setIsOpen((open) => !open)}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-16">
        {activeTab === 'catalog' ? (
          <div>
            <CatalogHero hero={hero} isLoading={heroLoading} />
            <CatalogFilters
              category={selectedCategory}
              onCategoryChange={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              categories={categoryOptions}
              organizations={filterOrgId ? [] : organizations}
              organizationId={selectedOrgId}
              onOrganizationChange={filterOrgId ? undefined : setSelectedOrgId}
            />

            {catalogError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
                <p>Could not load the service catalog.</p>
                <button
                  type="button"
                  onClick={refetchCatalog}
                  className="mt-3 rounded-full bg-stone-950 px-5 py-2 text-xs font-bold text-white"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {!catalogError && isFilteredView ? (
              <>
                {!results.isInitialLoading && results.services.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title="No services match your filters"
                    description="Try another salon, category, or search term to find available treatments."
                    actionLabel="Reset Filters"
                    onAction={() => {
                      setSelectedCategory('All')
                      setSearchQuery('')
                      if (!filterOrgId) setSelectedOrgId('')
                    }}
                  />
                ) : (
                  <CatalogSection
                    title="Results"
                    subtitle={filterOrgId ? 'Services at this salon' : 'Matching your filters'}
                    totalCount={results.total}
                    loadedCount={results.services.length}
                    hasMore={results.hasMore}
                    onShowMore={results.loadMore}
                    isLoading={results.isInitialLoading}
                    isLoadingMore={results.isLoadingMore}
                  >
                    {renderCards(results.services)}
                  </CatalogSection>
                )}
              </>
            ) : null}

            {!catalogError && !isFilteredView ? (
              <>
                <CatalogSection
                  title="Nearby"
                  subtitle={`Salons within ${NEARBY_RADIUS_KM} km of you`}
                  totalCount={nearby.total}
                  loadedCount={nearby.services.length}
                  hasMore={nearby.hasMore}
                  onShowMore={nearby.loadMore}
                  isLoading={Boolean(userCoords) && nearby.isInitialLoading}
                  isLoadingMore={nearby.isLoadingMore}
                  empty={
                    geoStatus === 'pending' || geoStatus === 'idle' ? (
                      <div className="flex items-center gap-2 rounded-2xl bg-stone-100/70 px-4 py-5 text-sm text-stone-500">
                        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                        Finding salons near you…
                      </div>
                    ) : geoStatus === 'ready' ? (
                      <div className="flex items-start gap-2.5 rounded-2xl bg-stone-100/70 px-4 py-5">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <div>
                          <p className="text-sm font-semibold text-stone-900">
                            No salons within {NEARBY_RADIUS_KM} km
                          </p>
                          <p className="mt-0.5 text-xs text-stone-500">
                            Browse popular treatments below, or widen your search with filters.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-3 rounded-2xl bg-stone-100/70 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          <div>
                            <p className="text-sm font-semibold text-stone-900">
                              Enable location to see nearby salons
                            </p>
                            <p className="mt-0.5 text-xs text-stone-500">
                              We use your position only to sort services by distance.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={requestLocation}
                          className="cursor-pointer rounded-full bg-stone-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800"
                        >
                          Use my location
                        </button>
                      </div>
                    )
                  }
                >
                  {renderCards(nearby.services)}
                </CatalogSection>

                <CatalogSection
                  title="Popular"
                  subtitle="High-demand treatments across salons"
                  totalCount={popular.total}
                  loadedCount={popular.services.length}
                  hasMore={popular.hasMore}
                  onShowMore={popular.loadMore}
                  isLoading={popular.isInitialLoading}
                  isLoadingMore={popular.isLoadingMore}
                  empty={
                    <div className="rounded-2xl bg-stone-100/70 px-4 py-5 text-sm text-stone-500">
                      No popular services yet.
                    </div>
                  }
                >
                  {renderCards(popular.services)}
                </CatalogSection>

                <CatalogSection
                  title="Browse all"
                  subtitle="Full marketplace catalog"
                  totalCount={browse.total}
                  loadedCount={browse.services.length}
                  hasMore={browse.hasMore}
                  onShowMore={browse.loadMore}
                  isLoading={browse.isInitialLoading}
                  isLoadingMore={browse.isLoadingMore}
                  empty={
                    <div className="rounded-2xl bg-stone-100/70 px-4 py-5 text-sm text-stone-500">
                      No services available.
                    </div>
                  }
                >
                  {renderCards(browse.services)}
                </CatalogSection>
              </>
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

      <ClientFooter hero={hero} />

      {(() => {
        const isCatalogActive = activeTab === 'catalog' && !concierge.isOpen
        const isAiActive = concierge.isOpen
        const isBookingsActive = activeTab === 'my-bookings' && !concierge.isOpen

        return (
          <nav
            aria-label="Mobile quick actions"
            className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm sm:max-w-md z-30 md:hidden flex items-center justify-between gap-1.5 rounded-full bg-gradient-to-b from-stone-900/95 via-stone-950/98 to-black/98 text-white p-1.5 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08),0_6px_24px_rgba(245,158,11,0.08)] backdrop-blur-2xl border border-white/[0.14] before:pointer-events-none before:absolute before:inset-x-8 before:-top-px before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-amber-400/50 before:to-transparent transition-all duration-300 ease-out ${
              isInputFocused
                ? 'opacity-0 translate-y-8 scale-95 pointer-events-none'
                : 'opacity-100 translate-y-0 scale-100'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('catalog')
                concierge.setIsOpen(false)
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer select-none active:scale-[0.96] ${
                isCatalogActive
                  ? 'bg-gradient-to-b from-white to-stone-100 text-stone-950 shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.9)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Catalog</span>
            </button>

            <button
              type="button"
              onClick={() => concierge.setIsOpen((open) => !open)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer select-none active:scale-[0.96] ${
                isAiActive
                  ? 'bg-gradient-to-b from-white to-stone-100 text-stone-950 shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.9)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Sparkles
                className={`h-3.5 w-3.5 transition-transform ${isAiActive ? 'text-amber-500 scale-110' : 'text-amber-400'}`}
              />
              <span>Ask AI</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('my-bookings')
                concierge.setIsOpen(false)
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer select-none active:scale-[0.96] ${
                isBookingsActive
                  ? 'bg-gradient-to-b from-white to-stone-100 text-stone-950 shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.9)]'
                  : 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span className="flex items-center gap-1.5">
                Bookings
                {activeHolds.length > 0 && (
                  <span
                    className={`h-4 min-w-4 px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center ${
                      isBookingsActive
                        ? 'bg-amber-400 text-stone-950 shadow-xs'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {activeHolds.length}
                  </span>
                )}
              </span>
            </button>
          </nav>
        )
      })()}

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
          onAuthorize={({ service, stylist, slot }) => void openCheckout(service, stylist, slot)}
          onClose={() => concierge.setIsOpen(false)}
          userCoords={userCoords}
        />
      )}

      {isPayPalOpen && selectedService && (
        <PaypalAuthModal
          service={selectedService}
          stylist={selectedStylist}
          slot={selectedSlot}
          step={authStep}
          confirmedBooking={confirmedBooking}
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
