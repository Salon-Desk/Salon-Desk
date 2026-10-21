'use client'

import {
  ArrowRight,
  Calendar,
  Clock,
  Lock,
  MapPin,
  ShieldCheck,
  Star,
  Store,
  User,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useState } from 'react'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { serviceImage } from '@/lib/data/service-content'
import { formatDuration, formatUsd } from '@/lib/format'
import { buildClientOrgStaffQueryArg } from '@/lib/listing-params/client-org-staff-list-params'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import {
  useGetCatalogCancellationPolicyQuery,
  useGetCatalogOrganizationQuery,
  useGetCatalogOrgFeedbackQuery,
  useGetCatalogOrgStaffQuery,
} from '@/store/api/clientApi'
import type { SalonService } from '@/types'
import type { CatalogService } from '@/types/api-org'

interface ServiceDetailModalProps {
  service: SalonService | CatalogService | null
  isOpen: boolean
  onClose: () => void
  onBook?: (serviceId: string) => void
}

function isSalonService(s: SalonService | CatalogService): s is SalonService {
  return 'durationMin' in s
}

export function ServiceDetailModal({ service, isOpen, onClose, onBook }: ServiceDetailModalProps) {
  const router = useRouter()
  const titleId = useId()
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'staff'>('overview')

  // Reset tab on service change
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview')
    }
  }, [isOpen, service])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const serviceId = service ? service.id : ''
  const orgId = service
    ? isSalonService(service)
      ? (service.organizationId ?? '')
      : service.organization_id
    : ''

  const { data: org } = useGetCatalogOrganizationQuery(orgId, { skip: !isOpen || !orgId })
  const { data: staffPage } = useGetCatalogOrgStaffQuery(buildClientOrgStaffQueryArg(orgId), {
    skip: !isOpen || !orgId,
  })
  const { data: reviewsPage } = useGetCatalogOrgFeedbackQuery(
    { orgId, page_size: 10 },
    { skip: !isOpen || !orgId },
  )
  const { data: policy } = useGetCatalogCancellationPolicyQuery(orgId, { skip: !isOpen || !orgId })

  if (!isOpen || !service) return null

  // Normalize fields between SalonService and CatalogService
  const isCustom = isSalonService(service)
  const name = service.name
  const description =
    service.description ||
    'Premium salon treatment customized for your personal hair, skin, and grooming care.'
  const durationMin = isCustom ? service.durationMin : service.duration_minutes
  const price = isCustom ? service.price : Number(service.base_price) || 0
  const holdAmount = isCustom
    ? service.holdDeposit
    : Number(service.authorization_hold_amount || service.base_price) || price
  const categoryName = isCustom ? service.category : service.category_name || 'Hair & Beauty'
  const salonName =
    (isCustom ? service.organizationName : service.organization_name) ||
    org?.name ||
    'Salon Partner'
  const ratingVal = isCustom
    ? service.rating && service.rating > 0
      ? service.rating
      : org?.rating_avg || 4.9
    : service.rating_avg && service.rating_avg > 0
      ? service.rating_avg
      : org?.rating_avg || 4.9
  const reviewsCount = isCustom
    ? (service.reviewsCount ?? org?.review_count ?? 12)
    : (service.review_count ?? org?.review_count ?? 12)
  const coverSrc = isCustom && service.imageUrl ? service.imageUrl : serviceImage(serviceId)

  const staffMembers = staffPage?.items ?? []
  const reviews = reviewsPage?.items ?? []
  const freeCancelHours = policy?.free_cancel_hours ?? 24

  const handleBookClick = () => {
    onClose()
    if (onBook) {
      onBook(serviceId)
    } else {
      router.push(`/client/book/${serviceId}`)
    }
  }

  return (
    <CustomResponsiveDialog
      open={isOpen}
      setOpen={(open) => {
        if (!open) onClose()
      }}
      classNameContent="max-w-2xl p-0 overflow-hidden rounded-3xl"
      classNameBody="p-0 max-h-[85vh] overflow-y-auto"
      hideFooterBorder={true}
    >
      <div className="relative flex w-full flex-col overflow-hidden bg-white">
        {/* Cover Photo Header */}
        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-stone-100 sm:h-56">
          <Image
            src={coverSrc}
            alt={name}
            fill
            priority
            unoptimized={shouldUnoptimizeImage(coverSrc)}
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 680px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="absolute top-4 right-4 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-stone-950/60 text-white backdrop-blur-md transition-colors hover:bg-stone-900"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Badges on Top Left */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 font-bold text-[11px] text-stone-900 shadow-sm backdrop-blur-md">
              <Lock className="h-3 w-3 text-amber-700" />
              <span>${holdAmount.toFixed(2)} Hold · $0 Today</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-950/60 px-2.5 py-1 font-semibold text-[11px] text-white backdrop-blur-md">
              <Clock className="h-3 w-3 text-amber-400" />
              <span>{formatDuration(durationMin)}</span>
            </span>
          </div>

          {/* Bottom Title Header in Image */}
          <div className="absolute right-4 bottom-3 left-4 z-10 text-white">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <span>{categoryName}</span>
              <span>•</span>
              <div className="flex items-center gap-1 text-white">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{ratingVal.toFixed(1)}</span>
                <span className="text-stone-300 font-normal">({reviewsCount} reviews)</span>
              </div>
            </div>
            <h2
              id={titleId}
              className="mt-1 font-serif text-2xl font-bold leading-tight sm:text-3xl text-balance"
            >
              {name}
            </h2>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 px-4 pt-1 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`cursor-pointer border-b-2 px-4 py-2.5 font-bold text-xs transition-colors ${
              activeTab === 'overview'
                ? 'border-amber-600 text-stone-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Overview &amp; Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`cursor-pointer border-b-2 px-4 py-2.5 font-bold text-xs transition-colors ${
              activeTab === 'staff'
                ? 'border-amber-600 text-stone-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Specialists ({staffMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`cursor-pointer border-b-2 px-4 py-2.5 font-bold text-xs transition-colors ${
              activeTab === 'reviews'
                ? 'border-amber-600 text-stone-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: OVERVIEW & POLICY */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Description */}
              <div>
                <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider text-stone-400 mb-1.5">
                  About this treatment
                </h3>
                <p className="text-sm leading-relaxed text-stone-600 whitespace-pre-line">
                  {description}
                </p>
              </div>

              {/* Zero upfront hold highlight */}
              <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-stone-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-stone-950">
                      $0 Debited Today · PayPal Authorization Hold
                    </h4>
                    <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                      You are not charged when booking. PayPal reserves an authorization hold of{' '}
                      <span className="font-bold text-stone-900">{formatUsd(holdAmount)}</span>{' '}
                      which is only debited upon completed appointment or uncancelled no-show.
                    </p>
                  </div>
                </div>
              </div>

              {/* Salon Details Card */}
              <div className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {org?.picture ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                        <Image
                          src={org.picture}
                          alt={salonName}
                          fill
                          unoptimized={shouldUnoptimizeImage(org.picture)}
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
                        <Store className="h-6 w-6 text-amber-700" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-stone-950 text-sm">{salonName}</h4>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-[10px] text-emerald-700">
                          Verified
                        </span>
                      </div>
                      {org?.physical_address && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                          <MapPin className="h-3 w-3 shrink-0 text-stone-400" />
                          <span className="truncate">{org.physical_address}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {orgId && (
                    <Link
                      href={`/client/org/${orgId}`}
                      onClick={onClose}
                      className="shrink-0 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 font-bold text-xs text-stone-800 transition-colors hover:bg-stone-100"
                    >
                      View Salon
                    </Link>
                  )}
                </div>
              </div>

              {/* Cancellation Policy summary */}
              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4">
                <h4 className="font-bold text-stone-900 text-xs mb-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-stone-500" />
                  Cancellation &amp; No-Show Policy
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Free cancellation is available up to{' '}
                  <span className="font-bold text-stone-900">{freeCancelHours} hours</span> before
                  your scheduled slot. If you cancel in time, your authorization hold is cancelled
                  immediately.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SPECIALISTS / STAFF */}
          {activeTab === 'staff' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-xs text-stone-500">
                These licensed professionals perform {name} at {salonName}:
              </p>
              {staffMembers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 p-8 text-center text-xs text-stone-400">
                  Staff details available upon booking selection.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {staffMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/60 p-3"
                    >
                      {member.picture ? (
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-stone-200">
                          <Image
                            src={member.picture}
                            alt={member.display_name}
                            fill
                            unoptimized={shouldUnoptimizeImage(member.picture)}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-xs text-stone-950">
                          {member.display_name}
                        </p>
                        <p className="truncate text-[11px] text-stone-500">{member.role}</p>
                        {member.rating_avg > 0 ? (
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-700 font-bold">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span>{member.rating_avg.toFixed(1)}</span>
                            <span className="text-stone-400 font-normal">
                              ({member.review_count})
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VERIFIED REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-900">
                  Client Reviews &amp; Ratings
                </span>
                <span className="text-xs text-stone-500">
                  {ratingVal.toFixed(1)} ★ overall rating
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 p-8 text-center text-xs text-stone-400">
                  No written reviews yet for this salon. Be one of the first!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-stone-900">
                            {rev.client_name || 'Verified Client'}
                          </span>
                          <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[9px] text-stone-500">
                            Verified Booking
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{rev.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {rev.comment || 'Great experience and attentive styling!'}
                      </p>
                      {rev.service_name && (
                        <p className="mt-1.5 text-[10px] text-stone-400">
                          Service: {rev.service_name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50/90 px-4 py-3.5 sm:px-6">
          <div>
            <span className="block text-[11px] text-stone-400 uppercase tracking-wider font-semibold">
              Total Service
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-stone-950">{formatUsd(price)}</span>
              <span className="text-[11px] font-semibold text-emerald-700">· $0 due today</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PrimaryButton
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="cursor-pointer rounded-full border border-stone-200 bg-white px-4 py-2 font-bold text-xs text-stone-700 hover:bg-stone-50"
              fullWidth={false}
              title="Close"
            />
            <PrimaryButton
              type="button"
              onClick={handleBookClick}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-stone-950 px-5 py-2 font-bold text-xs text-white shadow-none transition-all hover:bg-amber-700 active:scale-98 border-0"
              fullWidth={false}
            >
              <span>Book Appointment</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </PrimaryButton>
          </div>
        </div>
      </div>
    </CustomResponsiveDialog>
  )
}
