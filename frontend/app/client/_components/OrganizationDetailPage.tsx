'use client'

import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Heart,
  Lock,
  MapPin,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  User,
  Wifi,
  Wine,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { toastColor } from '@/constant/toast-color'
import { useListingParams } from '@/hooks/useListingParams'
import { serviceImage } from '@/lib/data/service-content'
import { formatDuration, formatUsd } from '@/lib/format'
import {
  buildClientOrgDetailServicesApiParams,
  clientOrgDetailListDefaults,
  type ClientOrgDetailListParams,
  ClientOrgDetailListParamsSchema,
} from '@/lib/listing-params/client-org-detail-list-params'
import { buildClientOrgStaffQueryArg } from '@/lib/listing-params/client-org-staff-list-params'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import {
  useGetCatalogCancellationPolicyQuery,
  useGetCatalogOrganizationQuery,
  useGetCatalogOrgStaffQuery,
  useGetCatalogServicesQuery,
} from '@/store/api/clientApi'
import type { CatalogService } from '@/types/api-org'

import { ClientFooter } from './ClientFooter'
import { ClientSalonFeedbackSection } from './ClientSalonFeedbackSection'
import { ServiceDetailModal } from './ServiceDetailModal'

interface OrganizationDetailPageProps {
  orgId: string
}

export function OrganizationDetailPage({ orgId }: OrganizationDetailPageProps) {
  const router = useRouter()
  const { params, displayParams, setParam, setParams } = useListingParams<
    ClientOrgDetailListParams,
    typeof ClientOrgDetailListParamsSchema
  >(ClientOrgDetailListParamsSchema)

  const activeTab = displayParams.tab
  const selectedCategory = displayParams.category
  const searchQuery = displayParams.search
  const [selectedService, setSelectedService] = useState<CatalogService | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Fetch Organization Data
  const {
    data: org,
    isLoading: orgLoading,
    isError: orgError,
  } = useGetCatalogOrganizationQuery(orgId)

  // Fetch Services for this Org
  const { data: servicesPage, isLoading: servicesLoading } = useGetCatalogServicesQuery(
    buildClientOrgDetailServicesApiParams(orgId, params),
  )

  // Fetch Staff for this Org
  const { data: staffPage, isLoading: staffLoading } = useGetCatalogOrgStaffQuery(
    buildClientOrgStaffQueryArg(orgId),
  )

  // Fetch Cancellation Policy for this Org
  const { data: policy } = useGetCatalogCancellationPolicyQuery(orgId)

  const services = useMemo(() => servicesPage?.items ?? [], [servicesPage?.items])
  const staff = useMemo(() => staffPage?.items ?? [], [staffPage?.items])

  // Extract unique category names
  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const s of services) {
      if (s.category_name) set.add(s.category_name)
    }
    return ['all', ...Array.from(set)]
  }, [services])

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesCat =
        selectedCategory === 'all' ||
        s.category_name?.toLowerCase() === selectedCategory.toLowerCase()
      return matchesCat
    })
  }, [services, selectedCategory])

  const handleOpenDetail = (service: CatalogService) => {
    setSelectedService(service)
    setIsDetailModalOpen(true)
  }

  const handleBookService = (serviceId: string, stylistId?: string) => {
    const url = stylistId
      ? `/client/book/${serviceId}?stylist=${stylistId}`
      : `/client/book/${serviceId}`
    router.push(url)
  }

  const handleShare = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: org?.name || 'Salon Profile',
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard', toastColor.success)
      }
    } catch {
      // User cancelled or clipboard permission denied
    }
  }

  if (orgLoading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 bg-stone-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
        <p className="font-medium text-stone-500 text-xs">Loading salon profile…</p>
      </div>
    )
  }

  if (orgError || !org) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <Store className="h-12 w-12 text-stone-300" />
        <h2 className="font-serif text-2xl text-stone-900">Salon not found</h2>
        <p className="max-w-md text-sm text-stone-500">
          This partner salon is either inactive, pending verification, or does not exist.
        </p>
        <Link
          href="/client"
          className="rounded-full bg-stone-950 px-5 py-2.5 font-bold text-xs text-white transition-colors hover:bg-stone-800"
        >
          Back to Marketplace
        </Link>
      </div>
    )
  }

  const ratingAvg = org.rating_avg && org.rating_avg > 0 ? org.rating_avg : 4.9
  const reviewCount = org.review_count ?? 18
  const coverPhoto = org.picture || serviceImage(org.id)
  const freeCancelHours = policy?.free_cancel_hours ?? 24

  return (
    <div className="min-h-screen bg-[#fcfbfa] text-stone-900">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/client"
            className="group flex items-center gap-2 font-bold text-xs text-stone-600 transition-colors hover:text-stone-950"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Marketplace</span>
            <span className="text-stone-300">/</span>
            <span className="truncate font-semibold text-stone-900">{org.name}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share salon link"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-950"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSaved((p) => !p)
                toast.success(
                  isSaved ? 'Removed from saved salons' : 'Saved to favorites',
                  toastColor.info,
                )
              }}
              aria-label="Save salon to favorites"
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-colors ${
                isSaved
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Cover Banner */}
      <div className="relative aspect-[21/9] max-h-[360px] w-full overflow-hidden bg-stone-900 sm:max-h-[420px]">
        <Image
          src={coverPhoto}
          alt={org.name}
          fill
          priority
          unoptimized={shouldUnoptimizeImage(coverPhoto)}
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent" />
      </div>

      {/* Salon Profile Header & Trust Card */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-20 z-10 mb-8 rounded-3xl border-[1px] border-stone-200 bg-white p-6 shadow-lg sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Avatar & Info */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-stone-100 shadow-md sm:h-24 sm:w-24">
                {org.picture ? (
                  <Image
                    src={org.picture}
                    alt={org.name}
                    fill
                    unoptimized={shouldUnoptimizeImage(org.picture)}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-stone-200 text-amber-800">
                    <Store className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-2xl font-bold text-stone-950 sm:text-3xl">
                    {org.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-[11px] text-emerald-700 ring-1 ring-emerald-600/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified Partner
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-600">
                  <button
                    type="button"
                    onClick={() => setParam('tab', 'reviews')}
                    className="flex cursor-pointer items-center gap-1 font-bold text-amber-700 hover:underline"
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{ratingAvg.toFixed(1)}</span>
                    <span className="font-normal text-stone-500">({reviewCount} reviews)</span>
                  </button>

                  {org.physical_address && (
                    <>
                      <span className="text-stone-300">•</span>
                      <span className="flex items-center gap-1 text-stone-600">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        <span className="truncate max-w-xs">{org.physical_address}</span>
                      </span>
                    </>
                  )}

                  {org.timezone && (
                    <>
                      <span className="text-stone-300">•</span>
                      <span className="flex items-center gap-1 text-stone-500">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        <span>{org.timezone.replace(/_/g, ' ')}</span>
                      </span>
                    </>
                  )}
                </div>

                {org.description && (
                  <p className="mt-2.5 max-w-2xl text-xs text-stone-600 sm:text-sm leading-relaxed line-clamp-2">
                    {org.description}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Quick CTA */}
            <div className="flex flex-col gap-2 shrink-0 sm:flex-row lg:flex-col lg:items-end">
              <button
                type="button"
                onClick={() => {
                  setParam('tab', 'services')
                  const el = document.getElementById('services-section')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-3 font-bold text-xs text-white shadow-md transition-all hover:bg-amber-700 hover:shadow-lg active:scale-98"
              >
                <span>Book Appointment</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <p className="text-center text-[11px] text-stone-500 lg:text-right">
                $0 debited today · PayPal hold
              </p>
            </div>
          </div>

          {/* Trust Guarantees Bar */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-stone-100 pt-5 sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-xl bg-stone-50/70 p-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                <Lock className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-[11px] text-stone-900">$0 Today</p>
                <p className="truncate text-[10px] text-stone-500">PayPal auth hold</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-stone-50/70 p-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                <Calendar className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-[11px] text-stone-900">
                  {freeCancelHours}h Free Cancel
                </p>
                <p className="truncate text-[10px] text-stone-500">100% hold released</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-stone-50/70 p-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                <User className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-[11px] text-stone-900">{staff.length} Specialists</p>
                <p className="truncate text-[10px] text-stone-500">Licensed team</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-stone-50/70 p-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-800">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-[11px] text-stone-900">Instant Confirm</p>
                <p className="truncate text-[10px] text-stone-500">Real-time slots</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 flex border-b border-stone-200">
          <button
            type="button"
            onClick={() => setParam('tab', 'services')}
            className={`cursor-pointer border-b-2 px-5 py-3 font-bold text-xs sm:text-sm transition-colors ${
              activeTab === 'services'
                ? 'border-stone-950 text-stone-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Services Menu ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setParam('tab', 'about')}
            className={`cursor-pointer border-b-2 px-5 py-3 font-bold text-xs sm:text-sm transition-colors ${
              activeTab === 'about'
                ? 'border-stone-950 text-stone-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            About &amp; Amenities
          </button>
          <button
            type="button"
            onClick={() => setParam('tab', 'staff')}
            className={`cursor-pointer border-b-2 px-5 py-3 font-bold text-xs sm:text-sm transition-colors ${
              activeTab === 'staff'
                ? 'border-stone-950 text-stone-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Specialists ({staff.length})
          </button>
          <button
            type="button"
            onClick={() => setParam('tab', 'reviews')}
            className={`cursor-pointer border-b-2 px-5 py-3 font-bold text-xs sm:text-sm transition-colors ${
              activeTab === 'reviews'
                ? 'border-stone-950 text-stone-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Client Reviews ({reviewCount})
          </button>
        </div>

        {/* TAB 1: SERVICES MENU */}
        {activeTab === 'services' && (
          <section
            id="services-section"
            className="space-y-6 pb-16 animate-in fade-in duration-200"
          >
            {/* Filters & Search */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setParam('category', cat)}
                    className={`cursor-pointer rounded-full px-3.5 py-1.5 font-bold text-xs capitalize transition-all ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-stone-950 text-white shadow-2xs'
                        : 'bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200'
                    }`}
                  >
                    {cat === 'all' ? 'All Services' : cat}
                  </button>
                ))}
              </div>

              {/* Service Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setParam('search', e.target.value)}
                  placeholder="Search salon treatments…"
                  className="w-full rounded-full border border-stone-200 bg-white py-2 pr-4 pl-9 text-xs text-stone-900 shadow-2xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Services Grid */}
            {servicesLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-3xl bg-stone-200/60 animate-pulse" />
                ))}
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-stone-200 bg-white p-12 text-center">
                <Store className="mx-auto h-10 w-10 text-stone-300" />
                <h3 className="mt-2 font-bold text-sm text-stone-800">
                  No services match your filter
                </h3>
                <p className="mt-1 text-xs text-stone-500">
                  Try clearing your search query or choosing another treatment category.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setParams({
                      category: clientOrgDetailListDefaults.category,
                      search: clientOrgDetailListDefaults.search,
                    })
                  }
                  className="mt-4 rounded-full border border-stone-200 px-4 py-1.5 font-bold text-xs text-stone-700 hover:bg-stone-50"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((svc) => {
                  const svcPrice = Number(svc.base_price) || 0
                  const svcHold =
                    Number(svc.authorization_hold_amount || svc.base_price) || svcPrice
                  const imageSrc =
                    svc.images && typeof svc.images === 'object' && Object.values(svc.images)[0]
                      ? String(Object.values(svc.images)[0])
                      : serviceImage(svc.id)

                  return (
                    <article
                      key={svc.id}
                      className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xs transition-all hover:border-amber-300 hover:shadow-md"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
                        <Image
                          src={imageSrc}
                          alt={svc.name}
                          fill
                          unoptimized={shouldUnoptimizeImage(imageSrc)}
                          className="object-cover transition-transform duration-500 group-hover:scale-104"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />

                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 font-bold text-[10px] text-stone-900 backdrop-blur-md shadow-2xs">
                            <Lock className="h-3 w-3 text-amber-700" />
                            <span>${svcHold.toFixed(2)} Hold · $0 Today</span>
                          </span>
                        </div>

                        <div className="absolute bottom-2.5 left-3 text-white">
                          <span className="font-semibold text-[10px] text-amber-300 uppercase tracking-wider">
                            {svc.category_name || 'Treatment'}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-stone-300">
                            <Clock className="h-3 w-3 text-amber-400" />
                            <span>{formatDuration(svc.duration_minutes)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <h3 className="font-bold text-stone-950 text-base group-hover:text-amber-800 transition-colors">
                            {svc.name}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs text-stone-500 leading-relaxed">
                            {svc.description ||
                              'Professional salon treatment with personalized styling and care.'}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                          <div>
                            <span className="text-[10px] font-semibold text-stone-400 block">
                              Total
                            </span>
                            <span className="text-base font-extrabold text-stone-950">
                              {formatUsd(svcPrice)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(svc)}
                              className="cursor-pointer rounded-full border border-stone-200 px-3 py-1.5 font-bold text-xs text-stone-700 hover:bg-stone-50"
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBookService(svc.id)}
                              className="cursor-pointer rounded-full bg-stone-950 px-4 py-1.5 font-bold text-xs text-white shadow-2xs transition-colors hover:bg-amber-700"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: ABOUT & POLICIES */}
        {activeTab === 'about' && (
          <section className="space-y-8 pb-16 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-8">
                {/* About description */}
                <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                  <h2 className="font-serif text-xl font-bold text-stone-950">About {org.name}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600 whitespace-pre-line">
                    {org.description ||
                      `${org.name} is a premier partner salon specializing in contemporary styling, hair wellness, and bespoke beauty treatments. Our team of certified professionals ensures an exceptional, relaxing experience tailored to your unique preferences.`}
                  </p>
                </div>

                {/* Amenities & Comfort */}
                <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                  <h3 className="font-bold text-stone-950 text-sm mb-4">
                    Salon Amenities &amp; Services
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3 text-xs text-stone-700">
                      <Lock className="h-4 w-4 text-amber-700 shrink-0" />
                      <span>$0 Upfront Debit · PayPal Hold</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3 text-xs text-stone-700">
                      <Wifi className="h-4 w-4 text-stone-600 shrink-0" />
                      <span>Complimentary High-Speed Wi-Fi</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3 text-xs text-stone-700">
                      <Wine className="h-4 w-4 text-stone-600 shrink-0" />
                      <span>Refreshments &amp; Herbal Teas</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3 text-xs text-stone-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Sanitized Tools &amp; Eco Products</span>
                    </div>
                  </div>
                </div>

                {/* Cancellation & No Show Policy */}
                <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                  <h3 className="font-bold text-stone-950 text-sm mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-700" />
                    Cancellation &amp; Settlement Policy
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed mb-4">
                    Appointments booked with {org.name} are safeguarded by PayPal authorization
                    holds.
                  </p>
                  <ul className="space-y-2 text-xs text-stone-700">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>
                        <strong>Free Cancellation:</strong> You can cancel up to{' '}
                        <strong>{freeCancelHours} hours</strong> before your appointment time with 0
                        fees and 100% hold release.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>
                        <strong>No-Show Protection:</strong> Uncancelled no-shows incur an agreed
                        hold capture of {policy?.no_show_fee_percent ?? 50}% to compensate the
                        specialist.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-stone-500 shrink-0" />
                      <span>
                        <strong>Transparent Settlement:</strong> When your appointment concludes,
                        the salon marks completed, and your final charge settles automatically.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Sidebar Location & Contact */}
              <div className="space-y-4 lg:col-span-4">
                <div className="rounded-3xl border border-stone-200 bg-white p-6">
                  <h3 className="font-bold text-stone-950 text-sm mb-3">Location &amp; Hours</h3>
                  <div className="space-y-3 text-xs text-stone-600">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-stone-900">Physical Address</p>
                        <p className="mt-0.5 text-stone-500">
                          {org.physical_address || 'Address provided upon booking'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Compass className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-stone-900">Timezone</p>
                        <p className="mt-0.5 text-stone-500">
                          {org.timezone || 'Local Salon Time'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: TEAM & SPECIALISTS */}
        {activeTab === 'staff' && (
          <section className="space-y-6 pb-16 animate-in fade-in duration-200">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-950">Meet the Team</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Licensed stylists and beauty artisans dedicated to your personal care.
              </p>
            </div>

            {staffLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 rounded-3xl bg-stone-200/60 animate-pulse" />
                ))}
              </div>
            ) : staff.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-stone-200 bg-white p-12 text-center text-xs text-stone-400">
                Staff directory will be displayed here soon.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col justify-between rounded-3xl border border-stone-200 bg-white p-5 shadow-2xs"
                  >
                    <div className="flex items-start gap-4">
                      {member.picture ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-2xs">
                          <Image
                            src={member.picture}
                            alt={member.display_name}
                            fill
                            unoptimized={shouldUnoptimizeImage(member.picture)}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                          <User className="h-8 w-8" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-stone-950 text-sm truncate">
                          {member.display_name}
                        </h3>
                        <p className="text-xs font-medium text-stone-500">{member.role}</p>
                        {member.rating_avg > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-700">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>{member.rating_avg.toFixed(1)}</span>
                            <span className="font-normal text-stone-400">
                              ({member.review_count} reviews)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {member.specialties && member.specialties.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {member.specialties.map((spec) => (
                          <span
                            key={spec}
                            className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-semibold text-stone-600"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 border-t border-stone-100 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (services.length > 0) {
                            handleBookService(services[0].id, member.id)
                          } else {
                            setParam('tab', 'services')
                          }
                        }}
                        className="w-full cursor-pointer rounded-full bg-stone-100 py-2 font-bold text-xs text-stone-800 transition-colors hover:bg-stone-200"
                      >
                        Book with {member.display_name.split(' ')[0]}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 4: CLIENT REVIEWS */}
        {activeTab === 'reviews' && (
          <section className="pb-16 animate-in fade-in duration-200">
            <ClientSalonFeedbackSection orgId={orgId} />
          </section>
        )}
      </div>

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedService}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onBook={(svcId) => handleBookService(svcId)}
      />

      <ClientFooter />
    </div>
  )
}
