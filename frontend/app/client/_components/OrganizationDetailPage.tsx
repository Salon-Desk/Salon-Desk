'use client'

import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  Lock,
  MapPin,
  Search,
  Share2,
  Sparkles,
  Star,
  Store,
  User,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { SandboxCredentialsIconButton } from '@/app/_components/SandboxCredentialsIconButton'
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
import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'
import {
  useGetCatalogCancellationPolicyQuery,
  useGetCatalogOrganizationQuery,
  useGetCatalogOrgStaffQuery,
  useGetCatalogServicesQuery,
} from '@/store/api/clientApi'
import type { CatalogService } from '@/types/api-org'

import { ClientFooter } from './ClientFooter'
import { ClientSalonFeedbackSection } from './ClientSalonFeedbackSection'
import { OrgDetailAboutTab } from './OrgDetailAboutTab'
import { OrgDetailStaffTab } from './OrgDetailStaffTab'
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
  const eligibleStylists = useMemo(
    () => staff.filter((s) => !s.role?.toLowerCase().includes('owner')),
    [staff],
  )

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedStylistId, setSelectedStylistId] = useState<string>('all')

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
      if (!matchesCat) return false
      if (selectedStylistId === 'all') return true
      const stylist = eligibleStylists.find((st) => st.id === selectedStylistId)
      if (!stylist) return true
      if (!stylist.specialties || stylist.specialties.length === 0) return true
      return stylist.specialties.some(
        (sp) =>
          sp.toLowerCase().includes(s.name.toLowerCase()) ||
          s.name.toLowerCase().includes(sp.toLowerCase()) ||
          (s.category_name && sp.toLowerCase().includes(s.category_name.toLowerCase())),
      )
    })
  }, [services, selectedCategory, selectedStylistId, eligibleStylists])

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds],
  )
  const totalSelectedPrice = useMemo(
    () => selectedServices.reduce((acc, s) => acc + (Number(s.base_price) || 0), 0),
    [selectedServices],
  )
  const totalSelectedDuration = useMemo(
    () => selectedServices.reduce((acc, s) => acc + (s.duration_minutes || 0), 0),
    [selectedServices],
  )

  const handleToggleSelectService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  const handleBookSelectedServices = () => {
    if (selectedServiceIds.length === 0) return
    const primaryId = selectedServiceIds[0]
    const extras = selectedServiceIds.slice(1).join(',')
    const extraParam = extras ? `&services=${extras}` : ''
    const stylistParam = selectedStylistId !== 'all' ? `&stylist=${selectedStylistId}` : ''
    const fullParams = `${extraParam}${stylistParam}`
    router.push(`/client/book/${primaryId}${fullParams ? `?${fullParams.replace(/^&/, '')}` : ''}`)
  }

  const handleOpenDetail = (service: CatalogService) => {
    setSelectedService(service)
    setIsDetailModalOpen(true)
  }

  const handleBookService = (serviceId: string, stylistId?: string) => {
    const activeStylist = stylistId || (selectedStylistId !== 'all' ? selectedStylistId : undefined)
    if (selectedServiceIds.length > 0) {
      const combined = selectedServiceIds.includes(serviceId)
        ? selectedServiceIds
        : [...selectedServiceIds, serviceId]
      const primaryId = combined[0]
      const extras = combined.slice(1).join(',')
      const extraParam = extras ? `&services=${extras}` : ''
      const stylistParam = activeStylist ? `&stylist=${activeStylist}` : ''
      const fullParams = `${extraParam}${stylistParam}`
      router.push(
        `/client/book/${primaryId}${fullParams ? `?${fullParams.replace(/^&/, '')}` : ''}`,
      )
      return
    }
    const url = activeStylist
      ? `/client/book/${serviceId}?stylist=${activeStylist}`
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
            <SandboxCredentialsIconButton />
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
          unoptimized={shouldUnoptimizedImage(coverPhoto)}
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
                    unoptimized={shouldUnoptimizedImage(org.picture)}
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
                className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-3 font-semibold text-xs text-white shadow-sm transition-all hover:bg-amber-600 hover:shadow-md active:scale-[0.98]"
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
        <div className="mb-8 flex overflow-x-auto scrollbar-none border-b border-stone-200">
          <button
            type="button"
            onClick={() => setParam('tab', 'services')}
            className={`cursor-pointer shrink-0 whitespace-nowrap border-b-2 px-5 py-3 font-bold text-xs sm:text-sm transition-colors ${
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
            className={`cursor-pointer shrink-0 whitespace-nowrap border-b-2 px-5 py-3 font-bold text-xs sm:text-sm transition-colors ${
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
            className={`cursor-pointer shrink-0 whitespace-nowrap border-b-2 px-5 py-3 font-bold text-xs sm:text-sm transition-colors ${
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
            className={`cursor-pointer shrink-0 whitespace-nowrap border-b-2 px-5 py-3 font-bold text-xs sm:text-sm transition-colors ${
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

            {/* Stylist Filter Bar */}
            {eligibleStylists.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="shrink-0 text-stone-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <User className="h-3 w-3" /> Stylist:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStylistId('all')}
                  className={`cursor-pointer rounded-full px-3 py-1 font-medium text-xs transition-all ${
                    selectedStylistId === 'all'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                      : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  Any Stylist
                </button>
                {eligibleStylists.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStylistId(st.id)}
                    className={`cursor-pointer rounded-full px-3 py-1 font-medium text-xs transition-all flex items-center gap-1.5 ${
                      selectedStylistId === st.id
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                        : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    <span>{st.display_name}</span>
                    {st.rating_avg > 0 && (
                      <span className="text-[10px] text-amber-700">
                        ★ {st.rating_avg.toFixed(1)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

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
                  const isSelected = selectedServiceIds.includes(svc.id)
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
                      className={`group flex flex-col justify-between overflow-hidden rounded-3xl border bg-white shadow-2xs transition-all ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-300/60 shadow-md'
                          : 'border-stone-200 hover:border-amber-300 hover:shadow-md'
                      }`}
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
                        <Image
                          src={imageSrc}
                          alt={svc.name}
                          fill
                          unoptimized={shouldUnoptimizedImage(imageSrc)}
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

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectService(svc.id)}
                              className={`inline-flex h-8 cursor-pointer items-center rounded-full px-3 text-xs font-semibold transition-all active:scale-[0.98] ${
                                isSelected
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                                  : 'border border-stone-200 text-stone-700 hover:border-amber-300 hover:bg-stone-50'
                              }`}
                            >
                              {isSelected ? '✓ Added' : '+ Add'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(svc)}
                              className="inline-flex h-8 cursor-pointer items-center rounded-full border border-stone-200 px-3 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 active:scale-[0.98]"
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBookService(svc.id)}
                              className="inline-flex h-8 cursor-pointer items-center rounded-full bg-stone-950 px-3.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-amber-600 active:scale-[0.98]"
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
          <OrgDetailAboutTab org={org} policy={policy} freeCancelHours={freeCancelHours} />
        )}

        {/* TAB 3: TEAM & SPECIALISTS */}
        {activeTab === 'staff' && (
          <OrgDetailStaffTab
            staff={staff}
            staffLoading={staffLoading}
            services={services}
            onBookService={handleBookService}
            onSwitchToServicesTab={() => setParam('tab', 'services')}
          />
        )}

        {/* TAB 4: CLIENT REVIEWS */}
        {activeTab === 'reviews' && (
          <section className="pb-16 animate-in fade-in duration-200">
            <ClientSalonFeedbackSection orgId={orgId} />
          </section>
        )}
      </div>

      {/* Sticky Bottom Bar for Multiple Selected Services */}
      {selectedServiceIds.length > 0 && activeTab === 'services' && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-300/40 bg-stone-950/95 px-4 py-3.5 text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-200">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <span>
                  {selectedServiceIds.length} service{selectedServiceIds.length > 1 ? 's' : ''}{' '}
                  selected
                </span>
                <span>·</span>
                <span className="text-white">{formatUsd(totalSelectedPrice)}</span>
                <span>·</span>
                <span className="text-stone-300">{formatDuration(totalSelectedDuration)}</span>
              </p>
              <p className="truncate text-[11px] text-stone-400">
                {selectedServices.map((s) => s.name).join(', ')}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedServiceIds([])}
                className="cursor-pointer rounded-full border border-stone-700 px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:bg-stone-800 hover:text-white"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleBookSelectedServices}
                className="cursor-pointer rounded-full bg-amber-500 px-5 py-1.5 text-xs font-bold text-stone-950 shadow-md transition-colors hover:bg-amber-400"
              >
                Book {selectedServiceIds.length} Service{selectedServiceIds.length > 1 ? 's' : ''} →
              </button>
            </div>
          </div>
        </div>
      )}

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
