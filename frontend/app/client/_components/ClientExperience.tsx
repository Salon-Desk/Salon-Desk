'use client'

import { ArrowLeft, Compass, Loader2, MapPin, Search, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'

import { CancelBookingDialog } from '@/app/client/_components/CancelBookingDialog'
import { EmptyState } from '@/components/empty'
import { Toast } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useGeolocation, useToast } from '@/hooks'
import {
  useSearchableCatalogCategories,
  useSearchableCatalogOrganizations,
} from '@/hooks/use-searchable-catalog-options'
import { useListingParams } from '@/hooks/useListingParams'
import { buildCancelOutcomePreview } from '@/lib/booking/cancel-policy'
import { ROUTES } from '@/lib/constants'
import { formatUsd } from '@/lib/format'
import {
  clientCatalogListDefaults,
  type ClientCatalogListParams,
  ClientCatalogListParamsSchema,
} from '@/lib/listing-params/client-catalog-list-params'
import {
  type ClientMyBookingsListParams,
  ClientMyBookingsListParamsSchema,
} from '@/lib/listing-params/client-my-bookings-list-params'
import { mapApiBookingToUi } from '@/lib/mappers/booking'
import type { RootState } from '@/store'
import { setChatMode, setChatOpen, setChatReplyContext } from '@/store/agentChatSlice'
import {
  useCancelBookingMutation,
  useGetCatalogCurationQuery,
  useGetCatalogHeroQuery,
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
import { CatalogFilters, type ServiceSort } from './CatalogFilters'
import { CatalogHero } from './CatalogHero'
import { CatalogSection } from './CatalogSection'
import { ClientCatalogHighlights } from './ClientCatalogHighlights'
import { checkoutPath } from './ClientCheckoutPage'
import { ClientExperienceMobileNav } from './ClientExperienceMobileNav'
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
  if (sort === 'distance') return 'distance'
  return 'name'
}

export interface ClientExperienceProps {
  initialTab?: ClientTab
  filterOrgId?: string
  /** `discover` is the catalog landing. `explore` is the dedicated filter page. */
  catalogMode?: 'discover' | 'explore'
}

export function ClientExperience({
  initialTab = 'catalog',
  filterOrgId,
  catalogMode = 'discover',
}: ClientExperienceProps) {
  const isExplorePage = catalogMode === 'explore' || Boolean(filterOrgId)
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
  } = useGeolocation({ requestOnMount: !isExplorePage })

  const [activeTab, setActiveTab] = useState<ClientTab>(initialTab)
  const { params, displayParams, setParam, setParams } = useListingParams<
    ClientCatalogListParams,
    typeof ClientCatalogListParamsSchema
  >(ClientCatalogListParamsSchema)

  const myBookingsListing = useListingParams<
    ClientMyBookingsListParams,
    typeof ClientMyBookingsListParamsSchema
  >(ClientMyBookingsListParamsSchema)

  const { data: curation, isLoading: curationLoading } = useGetCatalogCurationQuery(undefined, {
    skip: isExplorePage,
  })
  const { data: hero, isLoading: heroLoading } = useGetCatalogHeroQuery()
  const effectiveHero = curation?.hero || hero
  const categoryPicker = useSearchableCatalogCategories({ skip: !isExplorePage })
  const orgPicker = useSearchableCatalogOrganizations({
    selectedOrgId: filterOrgId ?? displayParams.orgId,
    ...(displayParams.sortBy === 'distance' && userCoords
      ? {
          lat: userCoords.lat,
          lng: userCoords.lng,
          sort: 'distance',
          max_distance_km: NEARBY_RADIUS_KM,
        }
      : {}),
  })
  const categories = categoryPicker.items
  const organizations = orgPicker.items
  const [fetchCatalogService] = useLazyGetCatalogServiceQuery()
  const {
    data: apiBookingsData,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useGetMyBookingsQuery(myBookingsListing.params, {
    skip: !isAuthenticated || !isClientUser(user),
  })
  const apiBookings = apiBookingsData?.items ?? []

  const [cancelBooking] = useCancelBookingMutation()

  const selectedCategory = displayParams.category
  const selectedOrgId = filterOrgId ?? displayParams.orgId
  const searchQuery = displayParams.search
  const debouncedSearch = (typeof params.q === 'string' ? params.q : '').trim()
  const sortBy = displayParams.sortBy
  const priceRange = displayParams.priceRange
  const minRating = displayParams.minRating > 0 ? displayParams.minRating : null
  const viewMode = displayParams.viewMode

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

  const categoryListControls = useMemo(
    () => ({
      onSearchChange: categoryPicker.setSearch,
      hasMore: categoryPicker.hasMore,
      onLoadMore: categoryPicker.loadMore,
      isLoadingMore: categoryPicker.isFetching,
      total: categoryPicker.total,
    }),
    [categoryPicker],
  )

  const organizationListControls = useMemo(
    () => ({
      onSearchChange: orgPicker.setSearch,
      hasMore: orgPicker.hasMore,
      onLoadMore: orgPicker.loadMore,
      isLoadingMore: orgPicker.isFetching,
      total: orgPicker.total,
    }),
    [orgPicker],
  )

  const effectiveOrgId = filterOrgId || selectedOrgId || undefined

  const priceFilterParams = useMemo(() => {
    if (priceRange === 'under-50') return { max_price: 50 }
    if (priceRange === '50-100') return { min_price: 50, max_price: 100 }
    if (priceRange === '100-150') return { min_price: 100, max_price: 150 }
    if (priceRange === '150-plus') return { min_price: 150 }
    return {}
  }, [priceRange])

  const isFilteredView =
    isExplorePage &&
    (Boolean(effectiveOrgId) ||
      selectedCategory !== 'All' ||
      debouncedSearch.length > 0 ||
      priceRange !== 'all' ||
      minRating !== null)

  const sharedFilters = useMemo(() => {
    if (!isExplorePage) return {}
    return {
      ...(categoryId ? { category_id: categoryId } : {}),
      ...(effectiveOrgId ? { org_id: effectiveOrgId } : {}),
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
      ...(typeof params.min_rating === 'number' && params.min_rating > 0
        ? { min_rating: params.min_rating }
        : {}),
      ...priceFilterParams,
    }
  }, [
    isExplorePage,
    categoryId,
    effectiveOrgId,
    debouncedSearch,
    params.min_rating,
    priceFilterParams,
  ])

  const isNearbyExplore = isExplorePage && sortBy === 'distance'

  useEffect(() => {
    if (isNearbyExplore && geoStatus === 'idle') {
      requestLocation()
    }
  }, [isNearbyExplore, geoStatus, requestLocation])

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

  const distanceFilters = useMemo(() => {
    if (sortBy !== 'distance') return {}
    return {
      sort: 'distance' as const,
      max_distance_km: NEARBY_RADIUS_KM,
      ...(userCoords ? { lat: userCoords.lat, lng: userCoords.lng } : {}),
    }
  }, [sortBy, userCoords])

  const browseFilters = useMemo(
    () => ({
      ...sharedFilters,
      sort: toApiSort(sortBy),
      ...distanceFilters,
    }),
    [sharedFilters, sortBy, distanceFilters],
  )

  const resultsFilters = useMemo(
    () => ({
      ...sharedFilters,
      sort: toApiSort(sortBy),
      ...distanceFilters,
    }),
    [sharedFilters, sortBy, distanceFilters],
  )

  const awaitingNearbyLocation = isNearbyExplore && !userCoords

  const nearby = usePagedCatalog(nearbyFilters, {
    pageSize: PAGE_SIZE,
    skip: isExplorePage || !userCoords,
  })
  const popular = usePagedCatalog(popularFilters, {
    pageSize: PAGE_SIZE,
    skip: isExplorePage,
  })
  const browse = usePagedCatalog(browseFilters, {
    pageSize: PAGE_SIZE,
    skip: !isExplorePage || isFilteredView || awaitingNearbyLocation,
  })
  const results = usePagedCatalog(resultsFilters, {
    pageSize: PAGE_SIZE,
    skip: !isExplorePage || !isFilteredView || awaitingNearbyLocation,
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

  const pendingBookings = uiBookings.filter(
    (b) => b.status === 'PENDING' || b.status === 'PENDING_PAYMENT',
  )
  const activeHolds = uiBookings.filter((b) => b.status === 'HELD' || b.status === 'REAUTHORIZED')
  const pastBookings = uiBookings.filter(
    (b) =>
      b.status !== 'HELD' &&
      b.status !== 'REAUTHORIZED' &&
      b.status !== 'PENDING' &&
      b.status !== 'PENDING_PAYMENT',
  )

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

  const handleAskAi = (service: SalonService) => {
    const replyContext = {
      serviceId: service.id,
      serviceName: service.name,
      organizationName: service.organizationName,
      basePrice: service.price,
      durationMinutes: service.durationMin,
      imageUrl: service.imageUrl,
      categoryName: service.category,
      description: service.description,
    }
    dispatch(setChatReplyContext(replyContext))
    dispatch(setChatMode('chat'))
    dispatch(setChatOpen(true))
    window.dispatchEvent(
      new CustomEvent('salondesk:open_chat', {
        detail: {
          mode: 'chat',
          replyContext,
        },
      }),
    )
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

  const catalogError = isExplorePage
    ? isFilteredView
      ? results.isError
      : browse.isError
    : popular.isError || (userCoords ? nearby.isError : false)

  const refetchCatalog = () => {
    if (!isExplorePage) {
      void popular.refetch()
      if (userCoords) void nearby.refetch()
      return
    }
    if (isFilteredView) {
      void results.refetch()
      return
    }
    void browse.refetch()
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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-6 md:pb-16 lg:px-8">
        {activeTab === 'catalog' ? (
          <div>
            {isExplorePage ? (
              <div className="mb-6 sm:mb-8">
                <Link
                  href={ROUTES.client}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 transition-colors hover:text-stone-900"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to discovery
                </Link>
                <h1 className="mt-3 font-extrabold text-2xl tracking-tight text-stone-950 sm:text-3xl">
                  Explore treatments
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-stone-500">
                  Filter by salon, category, price, and rating to find a service.
                </p>
              </div>
            ) : (
              <CatalogHero hero={effectiveHero} isLoading={heroLoading && curationLoading} />
            )}

            {!isExplorePage && <ClientCatalogHighlights />}

            {!isExplorePage && (
              <>
                <CatalogFeaturedSection
                  featuredOrganizations={curation?.featured_organizations ?? []}
                  featuredServices={curation?.featured_services ?? []}
                  onSelectOrganization={(orgId) =>
                    router.push(`${ROUTES.clientExplore}?orgId=${encodeURIComponent(orgId)}`)
                  }
                  onQuickBookService={handleStartBooking}
                  onAskAiService={handleAskAi}
                />
                <div className="mb-8 sm:mb-12 h-px w-full bg-gradient-to-r from-transparent via-stone-200/80 to-transparent" />
              </>
            )}

            {filterOrgId ? <ClientSalonFeedbackSection orgId={filterOrgId} /> : null}

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

            {isExplorePage ? (
              <>
                <CatalogFilters
                  category={selectedCategory}
                  onCategoryChange={(category) => setParam('category', category)}
                  searchQuery={searchQuery}
                  onSearchChange={(value) => setParam('search', value)}
                  sortBy={sortBy}
                  onSortChange={(sort) => setParam('sortBy', sort)}
                  priceRange={priceRange}
                  onPriceRangeChange={(range) => setParam('priceRange', range)}
                  minRating={minRating}
                  onMinRatingChange={(rating) => setParam('minRating', rating ?? 0)}
                  viewMode={viewMode}
                  onViewModeChange={(mode) => setParam('viewMode', mode)}
                  categories={categoryOptions}
                  organizations={filterOrgId ? [] : organizations}
                  organizationId={selectedOrgId}
                  onOrganizationChange={
                    filterOrgId ? undefined : (orgId) => setParam('orgId', orgId)
                  }
                  organizationListControls={filterOrgId ? undefined : organizationListControls}
                  categoryListControls={categoryListControls}
                  onClearAll={() => {
                    setParams({
                      ...clientCatalogListDefaults,
                      ...(filterOrgId ? { orgId: filterOrgId } : {}),
                    })
                  }}
                />

                {!catalogError && awaitingNearbyLocation ? (
                  <div className="flex flex-col items-start gap-3 rounded-2xl bg-stone-100/70 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-stone-900">
                          {geoStatus === 'pending' || geoStatus === 'idle'
                            ? 'Finding salons near you…'
                            : 'Enable location to see nearby salons'}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-500">
                          Nearby results stay within {NEARBY_RADIUS_KM} km of your position.
                        </p>
                      </div>
                    </div>
                    {geoStatus !== 'pending' && geoStatus !== 'idle' ? (
                      <button
                        type="button"
                        onClick={requestLocation}
                        className="cursor-pointer rounded-full bg-stone-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800"
                      >
                        Use my location
                      </button>
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                    )}
                  </div>
                ) : null}

                {!catalogError && isFilteredView && !awaitingNearbyLocation ? (
                  !results.isInitialLoading && results.services.length === 0 ? (
                    <EmptyState
                      icon={Search}
                      title="No services match your filters"
                      description="Try another salon, category, price range, or search term to find available treatments."
                      actionLabel="Reset Filters"
                      onAction={() => {
                        setParams({
                          ...clientCatalogListDefaults,
                          ...(filterOrgId ? { orgId: filterOrgId } : {}),
                        })
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
                  )
                ) : null}

                {!catalogError && !isFilteredView && !awaitingNearbyLocation ? (
                  <CatalogSection
                    title={
                      isNearbyExplore ? 'Nearby Salons & Studios' : 'All Marketplace Treatments'
                    }
                    eyebrow={isNearbyExplore ? 'LOCAL NEIGHBORHOOD' : 'FULL CATALOG DIRECTORY'}
                    icon={
                      isNearbyExplore ? (
                        <MapPin className="h-3 w-3 text-emerald-700" />
                      ) : (
                        <Compass className="h-3 w-3 text-purple-700" />
                      )
                    }
                    tone={isNearbyExplore ? 'emerald' : 'purple'}
                    subtitle={
                      isNearbyExplore
                        ? `Treatments within ${NEARBY_RADIUS_KM} km of your position`
                        : 'Browse the complete directory of salon styling, hair wellness, and grooming care'
                    }
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
                ) : null}
              </>
            ) : !catalogError ? (
              <>
                <CatalogSection
                  title="Nearby Salons & Studios"
                  eyebrow="LOCAL NEIGHBORHOOD"
                  icon={<MapPin className="h-3 w-3 text-emerald-700" />}
                  tone="emerald"
                  subtitle={`Top treatments within ${NEARBY_RADIUS_KM} km of your position`}
                  totalCount={nearby.total}
                  loadedCount={nearby.services.length}
                  hasMore={nearby.hasMore}
                  onShowMore={() => router.push(`${ROUTES.clientExplore}?sort=distance`)}
                  isLoading={Boolean(userCoords) && nearby.isInitialLoading}
                  isLoadingMore={false}
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
                            Browse popular treatments below, or{' '}
                            <Link
                              href={ROUTES.clientExplore}
                              className="font-semibold text-amber-800 hover:underline"
                            >
                              explore more
                            </Link>{' '}
                            with filters.
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
                  title="Trending & Highest Rated"
                  eyebrow="COMMUNITY FAVORITES"
                  icon={<Sparkles className="h-3 w-3 text-amber-700" />}
                  tone="amber"
                  variant="island"
                  subtitle="Ranked by client ratings, rebookings, and verified review sentiment"
                  totalCount={popular.total}
                  loadedCount={popular.services.length}
                  hasMore={popular.hasMore}
                  onShowMore={() => router.push(`${ROUTES.clientExplore}?sort=popular`)}
                  isLoading={popular.isInitialLoading}
                  isLoadingMore={false}
                  viewMode={viewMode}
                  empty={
                    <div className="rounded-2xl bg-stone-100/70 px-4 py-5 text-sm text-stone-500">
                      No popular services yet.
                    </div>
                  }
                >
                  {renderCards(popular.services)}
                </CatalogSection>

                <div className="mb-12 flex flex-col items-center gap-3 text-center sm:mb-16">
                  <p className="max-w-md text-sm text-stone-500">
                    Search the full marketplace by salon, category, price, and rating.
                  </p>
                  <Link
                    href={ROUTES.clientExplore}
                    className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-7 py-3 text-sm font-bold text-white shadow-xs transition-colors hover:bg-amber-700"
                  >
                    <Compass className="h-4 w-4" />
                    Explore more
                  </Link>
                </div>
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
                  pendingBookings={pendingBookings}
                  activeHolds={activeHolds}
                  pastBookings={pastBookings}
                  onBrowseCatalog={() => setActiveTab('catalog')}
                  onCancel={setCancelTarget}
                  onViewReceipt={setReceiptBooking}
                  onCompletePayment={(booking) => {
                    const liveSlot =
                      booking.startsAt && !Number.isNaN(Date.parse(booking.startsAt))
                        ? booking.startsAt
                        : null
                    router.push(
                      checkoutPath(booking.serviceId, {
                        slot: liveSlot,
                        stylist: booking.stylistId || undefined,
                      }),
                    )
                  }}
                  searchQuery={myBookingsListing.displayParams.q}
                  onSearchChange={(value) => myBookingsListing.setParam('q', value)}
                  sortBy={myBookingsListing.displayParams.sort}
                  onSortChange={(value) =>
                    myBookingsListing.setParam(
                      'sort',
                      value as
                        | 'starts_at_asc'
                        | 'starts_at_desc'
                        | 'created_at_asc'
                        | 'created_at_desc'
                        | 'total_price_asc'
                        | 'total_price_desc',
                    )
                  }
                />
              </>
            )}
          </>
        )}
      </main>

      <ClientFooter hero={hero} hasMobileNav />

      <ClientExperienceMobileNav
        activeTab={activeTab}
        isChatOpen={isChatOpen}
        onToggleChat={() => dispatch(setChatOpen(!isChatOpen))}
        isInputFocused={isInputFocused}
        activeHoldsCount={activeHolds.length}
      />

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
