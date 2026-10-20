'use client'

import {
  Calendar,
  Clock,
  Compass,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'

import { CancelBookingDialog } from '@/app/client/_components/CancelBookingDialog'
import { EmptyState, Toast } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useGeolocation, useToast } from '@/hooks'
import { useDebounce } from '@/hooks/use-debounce'
import { buildCancelOutcomePreview } from '@/lib/booking/cancel-policy'
import { formatUsd } from '@/lib/format'
import { mapApiBookingToUi } from '@/lib/mappers/booking'
import type { RootState } from '@/store'
import { setChatMode, setChatOpen } from '@/store/agentChatSlice'
import {
  useCancelBookingMutation,
  useGetCatalogCategoriesQuery,
  useGetCatalogCurationQuery,
  useGetCatalogHeroQuery,
  useGetCatalogOrganizationsQuery,
  useGetMyBookingsQuery,
  useLazyGetCatalogServiceQuery,
} from '@/store/api/clientApi'
import { isAuthenticatedSelector, isClientUser, userSelector } from '@/store/authSlice'
import type { Booking, SalonService, StaffMember } from '@/types'
import type { CatalogService, CatalogServiceSort } from '@/types/api-org'

import { usePagedCatalog } from '../_hooks/use-paged-catalog'
import { BookingReceipt as ReceiptModal } from './BookingReceipt'
import { BookingsPanel } from './BookingsPanel'
import { CatalogFeaturedSection } from './CatalogFeaturedSection'
import { CatalogFilters, type PriceRange, type ServiceSort } from './CatalogFilters'
import { CatalogHero } from './CatalogHero'
import { CatalogSection } from './CatalogSection'
import { checkoutPath } from './ClientCheckoutPage'
import { ClientFooter } from './ClientFooter'
import { ClientHeader, type ClientTab } from './ClientHeader'
import { ClientMyBookingsReviews } from './ClientMyBookingsReviews'
import { ClientSalonFeedbackSection } from './ClientSalonFeedbackSection'
import { ProtocolModal } from './ProtocolModal'
import { ServiceCard } from './ServiceCard'

const PAGE_SIZE = 6
const NEARBY_RADIUS_KM = 15

function toApiSort(sort: ServiceSort): CatalogServiceSort {
  if (sort === 'price-asc') return 'price_asc'
  if (sort === 'price-desc') return 'price_desc'
  if (sort === 'duration') return 'duration'
  if (sort === 'rating') return 'rating'
  if (sort === 'popular') return 'popular'
  return 'name'
}

export interface ClientExperienceProps {
  initialTab?: ClientTab
  filterOrgId?: string
}

export function ClientExperience({ initialTab = 'catalog', filterOrgId }: ClientExperienceProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { message: toastMessage, show: showToast, dismiss } = useToast()
  const isChatOpen = useSelector((state: RootState) => state.agentChat?.isOpen ?? false)
  const user = useSelector(userSelector)
  const isAuthenticated = useSelector(isAuthenticatedSelector)
  const {
    coords: userCoords,
    status: geoStatus,
    request: requestLocation,
  } = useGeolocation({ requestOnMount: !filterOrgId })

  const { data: curation, isLoading: curationLoading } = useGetCatalogCurationQuery()
  const { data: hero, isLoading: heroLoading } = useGetCatalogHeroQuery()
  const effectiveHero = curation?.hero || hero
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

  const [cancelBooking] = useCancelBookingMutation()

  const [activeTab, setActiveTab] = useState<ClientTab>(initialTab)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedOrgId, setSelectedOrgId] = useState(filterOrgId ?? '')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<ServiceSort>('popular')
  const [priceRange, setPriceRange] = useState<PriceRange>('all')
  const [minRating, setMinRating] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const debouncedSearch = useDebounce(searchQuery.trim(), 300)

  useEffect(() => {
    setSelectedOrgId(filterOrgId ?? '')
  }, [filterOrgId])

  const [protocolService, setProtocolService] = useState<SalonService | null>(null)
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
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

  const priceFilterParams = useMemo(() => {
    if (priceRange === 'under-50') return { max_price: 50 }
    if (priceRange === '50-100') return { min_price: 50, max_price: 100 }
    if (priceRange === '100-150') return { min_price: 100, max_price: 150 }
    if (priceRange === '150-plus') return { min_price: 150 }
    return {}
  }, [priceRange])

  const ratingFilterParams = useMemo(() => {
    if (minRating !== null) return { min_rating: minRating }
    return {}
  }, [minRating])

  const isFilteredView =
    Boolean(effectiveOrgId) ||
    selectedCategory !== 'All' ||
    debouncedSearch.length > 0 ||
    priceRange !== 'all' ||
    minRating !== null

  const sharedFilters = useMemo(
    () => ({
      ...(categoryId ? { category_id: categoryId } : {}),
      ...(effectiveOrgId ? { org_id: effectiveOrgId } : {}),
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
      ...priceFilterParams,
      ...ratingFilterParams,
    }),
    [categoryId, effectiveOrgId, debouncedSearch, priceFilterParams, ratingFilterParams],
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
      sort: toApiSort(sortBy),
    }),
    [sharedFilters, sortBy],
  )

  const resultsFilters = useMemo(
    () => ({
      ...sharedFilters,
      sort: toApiSort(sortBy),
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
    // Prefer live ISO timestamps; ignore demo labels like "Tomorrow · 2:00 PM".
    const liveSlot = slot && !Number.isNaN(Date.parse(slot)) ? slot : null
    router.push(checkoutPath(catalog.id, { slot: liveSlot, stylist: stylist?.id }))
  }

  const handleStartBooking = (service: SalonService) => {
    void openCheckout(service)
  }

  const handleAskAi = (_service: SalonService) => {
    dispatch(setChatMode('chat'))
    dispatch(setChatOpen(true))
    window.dispatchEvent(new CustomEvent('salondesk:open_chat', { detail: { mode: 'chat' } }))
  }

  const handleConfirmCancelBooking = async () => {
    if (!cancelTarget) return
    const preview = buildCancelOutcomePreview({
      totalPrice: cancelTarget.servicePrice,
      agreedNoShowFee: cancelTarget.noShowFee,
      agreedLateCancelFee: cancelTarget.lateCancelFee,
      freeCancelDeadlineAt: cancelTarget.freeCancelDeadlineAt ?? cancelTarget.authExpiresAt,
      policySnapshot: cancelTarget.policySnapshot,
    })
    setCancelSubmitting(true)
    try {
      await cancelBooking({
        bookingId: cancelTarget.id,
        body: { reason: 'Client self-service cancellation' },
      }).unwrap()
      void refetchBookings()
      setCancelTarget(null)
      showToast(
        preview.withinFreeWindow
          ? 'Appointment cancelled. Your PayPal hold was released ($0 charged).'
          : `Appointment cancelled. ${formatUsd(preview.chargeAmount)} late-cancellation fee captured; remaining hold released.`,
      )
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not cancel booking'
      toast.error(String(message), toastColor.error)
    } finally {
      setCancelSubmitting(false)
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
        viewMode={viewMode}
        onAskAi={handleAskAi}
        onQuickBook={handleStartBooking}
        onOpenProtocol={setProtocolService}
      />
    ))

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-[#fbfbfa] font-sans text-stone-900 selection:bg-amber-500/20">
      {/* Ambient background illumination */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[500px] w-full max-w-7xl -translate-x-1/2 overflow-hidden blur-3xl opacity-60">
        <div className="mx-auto h-[350px] w-[700px] rounded-full bg-gradient-to-br from-amber-200/25 via-orange-100/15 to-transparent" />
      </div>

      {toastMessage && <Toast message={toastMessage} onDismiss={dismiss} position="bottom-right" />}

      <ClientHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeHoldsCount={activeHolds.length}
        conciergeOpen={isChatOpen}
        onToggleConcierge={() => dispatch(setChatOpen(!isChatOpen))}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-16">
        {activeTab === 'catalog' ? (
          <div>
            <CatalogHero hero={effectiveHero} isLoading={heroLoading && curationLoading} />

            {/* Value Props & Trust Highlights Ribbon */}
            <div className="mb-10 sm:mb-14 overflow-hidden rounded-3xl border border-stone-200/80 bg-white/95 shadow-xs backdrop-blur-xl">
              <div className="grid grid-cols-2 divide-y divide-stone-100 sm:grid-cols-4 sm:divide-y-0 sm:divide-x sm:divide-stone-100">
                <div className="flex items-center gap-3 p-3.5 sm:p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-2xs">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-stone-900">$0 Debited Today</p>
                    <p className="truncate text-[11px] text-stone-500">
                      PayPal auth hold guarantee
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 sm:p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 shadow-2xs">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-stone-900">Verified Salons</p>
                    <p className="truncate text-[11px] text-stone-500">
                      Licensed studio specialists
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 sm:p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 shadow-2xs">
                    <Calendar className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-stone-900">Instant Confirm</p>
                    <p className="truncate text-[11px] text-stone-500">Real-time schedule lock</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 sm:p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 shadow-2xs">
                    <Clock className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-stone-900">Free Cancellation</p>
                    <p className="truncate text-[11px] text-stone-500">100% hold release window</p>
                  </div>
                </div>
              </div>
            </div>

            {!filterOrgId && !isFilteredView && (
              <>
                <CatalogFeaturedSection
                  featuredOrganizations={curation?.featured_organizations ?? []}
                  featuredServices={curation?.featured_services ?? []}
                  onSelectOrganization={(orgId) => setSelectedOrgId(orgId)}
                  onQuickBookService={handleStartBooking}
                  onAskAiService={handleAskAi}
                />
                <div className="mb-8 sm:mb-12 h-px w-full bg-gradient-to-r from-transparent via-stone-200/80 to-transparent" />
              </>
            )}

            {filterOrgId ? <ClientSalonFeedbackSection orgId={filterOrgId} /> : null}

            <CatalogFilters
              category={selectedCategory}
              onCategoryChange={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              minRating={minRating}
              onMinRatingChange={setMinRating}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              categories={categoryOptions}
              organizations={filterOrgId ? [] : organizations}
              organizationId={selectedOrgId}
              onOrganizationChange={filterOrgId ? undefined : setSelectedOrgId}
              onClearAll={() => {
                setSelectedCategory('All')
                setSearchQuery('')
                setPriceRange('all')
                setMinRating(null)
                if (!filterOrgId) setSelectedOrgId('')
              }}
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
                    description="Try another salon, category, price range, or search term to find available treatments."
                    actionLabel="Reset Filters"
                    onAction={() => {
                      setSelectedCategory('All')
                      setSearchQuery('')
                      setPriceRange('all')
                      setMinRating(null)
                      if (!filterOrgId) setSelectedOrgId('')
                    }}
                  />
                ) : (
                  <CatalogSection
                    title="Matching Treatments"
                    eyebrow="FILTERED DISCOVERIES"
                    icon={<Search className="h-3 w-3 text-amber-700" />}
                    tone="amber"
                    subtitle={
                      filterOrgId
                        ? 'Services at this salon'
                        : 'Customized to your active preferences'
                    }
                    totalCount={results.total}
                    loadedCount={results.services.length}
                    hasMore={results.hasMore}
                    onShowMore={results.loadMore}
                    isLoading={results.isInitialLoading}
                    isLoadingMore={results.isLoadingMore}
                    viewMode={viewMode}
                  >
                    {renderCards(results.services)}
                  </CatalogSection>
                )}
              </>
            ) : null}

            {!catalogError && !isFilteredView ? (
              <>
                <CatalogSection
                  title="Nearby Salons &amp; Studios"
                  eyebrow="LOCAL NEIGHBORHOOD"
                  icon={<MapPin className="h-3 w-3 text-emerald-700" />}
                  tone="emerald"
                  subtitle={`Top treatments within ${NEARBY_RADIUS_KM} km of your position`}
                  totalCount={nearby.total}
                  loadedCount={nearby.services.length}
                  hasMore={nearby.hasMore}
                  onShowMore={nearby.loadMore}
                  isLoading={Boolean(userCoords) && nearby.isInitialLoading}
                  isLoadingMore={nearby.isLoadingMore}
                  viewMode={viewMode}
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
                  title="Trending &amp; Highest Rated"
                  eyebrow="COMMUNITY FAVORITES"
                  icon={<Sparkles className="h-3 w-3 text-amber-700" />}
                  tone="amber"
                  variant="island"
                  subtitle="Ranked by client ratings, rebookings, and verified review sentiment"
                  totalCount={popular.total}
                  loadedCount={popular.services.length}
                  hasMore={popular.hasMore}
                  onShowMore={popular.loadMore}
                  isLoading={popular.isInitialLoading}
                  isLoadingMore={popular.isLoadingMore}
                  viewMode={viewMode}
                  empty={
                    <div className="rounded-2xl bg-stone-100/70 px-4 py-5 text-sm text-stone-500">
                      No popular services yet.
                    </div>
                  }
                >
                  {renderCards(popular.services)}
                </CatalogSection>

                <CatalogSection
                  title="Explore All Marketplace Treatments"
                  eyebrow="FULL CATALOG DIRECTORY"
                  icon={<Compass className="h-3 w-3 text-purple-700" />}
                  tone="purple"
                  showTopDivider
                  subtitle="Browse the complete directory of salon styling, hair wellness, and grooming care"
                  totalCount={browse.total}
                  loadedCount={browse.services.length}
                  hasMore={browse.hasMore}
                  onShowMore={browse.loadMore}
                  isLoading={browse.isInitialLoading}
                  isLoadingMore={browse.isLoadingMore}
                  viewMode={viewMode}
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
              <>
                <ClientMyBookingsReviews />
                <BookingsPanel
                  activeHolds={activeHolds}
                  pastBookings={pastBookings}
                  onBrowseCatalog={() => setActiveTab('catalog')}
                  onCancel={setCancelTarget}
                  onViewReceipt={setReceiptBooking}
                />
              </>
            )}
          </>
        )}
      </main>

      <ClientFooter hero={hero} />

      {(() => {
        const isCatalogActive = activeTab === 'catalog' && !isChatOpen
        const isAiActive = isChatOpen
        const isBookingsActive = activeTab === 'my-bookings' && !isChatOpen

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
              onClick={() => dispatch(setChatOpen(!isChatOpen))}
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

      {cancelTarget ? (
        <CancelBookingDialog
          booking={cancelTarget}
          preview={buildCancelOutcomePreview({
            totalPrice: cancelTarget.servicePrice,
            agreedNoShowFee: cancelTarget.noShowFee,
            agreedLateCancelFee: cancelTarget.lateCancelFee,
            freeCancelDeadlineAt: cancelTarget.freeCancelDeadlineAt ?? cancelTarget.authExpiresAt,
            policySnapshot: cancelTarget.policySnapshot,
          })}
          isSubmitting={cancelSubmitting}
          onClose={() => {
            if (!cancelSubmitting) setCancelTarget(null)
          }}
          onConfirm={() => void handleConfirmCancelBooking()}
        />
      ) : null}
    </div>
  )
}
