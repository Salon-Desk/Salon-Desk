'use client'

import {
  ArrowUpRight,
  Building2,
  Clock,
  Lock,
  MapPin,
  MessageSquare,
  Sparkles,
  Star,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { serviceImage } from '@/lib/data/service-content'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import type { SalonService } from '@/types'
import type { FeaturedOrganization, FeaturedService } from '@/types/api-org'

interface CatalogFeaturedSectionProps {
  featuredOrganizations: FeaturedOrganization[]
  featuredServices: FeaturedService[]
  onSelectOrganization: (orgId: string) => void
  onQuickBookService: (service: SalonService) => void
  onAskAiService: (service: SalonService) => void
}

export function CatalogFeaturedSection({
  featuredOrganizations,
  featuredServices,
  onSelectOrganization,
  onQuickBookService,
  onAskAiService,
}: CatalogFeaturedSectionProps) {
  const [activeTab, setActiveTab] = useState<'salons' | 'services'>('salons')

  const activeOrgs = featuredOrganizations.filter((o) => o.is_active)
  const activeSvcs = featuredServices.filter((s) => s.is_active)

  if (activeOrgs.length === 0 && activeSvcs.length === 0) {
    return null
  }

  return (
    <section className="relative mb-12 sm:mb-16 overflow-hidden rounded-3xl border border-stone-200/90 bg-gradient-to-b from-stone-50/90 via-white to-stone-50/40 p-5 sm:p-7 shadow-xs">
      {/* Decorative ambient flare */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Handpicked by Editors
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-stone-950 sm:text-2xl tracking-tight">
            Featured Spotlight
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            Top-rated verified salons and signature treatments with PayPal $0 deposit authorization
            holds.
          </p>
        </div>

        {activeOrgs.length > 0 && activeSvcs.length > 0 && (
          <div className="inline-flex shrink-0 rounded-full bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('salons')}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'salons'
                  ? 'bg-stone-950 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              Salons ({activeOrgs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'services'
                  ? 'bg-stone-950 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              Services ({activeSvcs.length})
            </button>
          </div>
        )}
      </div>

      {/* Featured Salons Grid */}
      {(activeTab === 'salons' || activeSvcs.length === 0) && activeOrgs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeOrgs.map((item) => {
            const org = item.organization
            return (
              <article
                key={item.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-4 shadow-xs transition-all hover:border-amber-400 hover:shadow-md"
              >
                <div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-stone-100">
                    {org.picture ? (
                      <Image
                        src={org.picture}
                        alt={org.name}
                        fill
                        unoptimized={shouldUnoptimizeImage(org.picture)}
                        className="object-cover transition-transform duration-500 group-hover:scale-104"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-stone-200 text-stone-400">
                        <Building2 className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />

                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-stone-950 shadow-xs">
                        <Sparkles className="h-3 w-3" />
                        {item.badge_text}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-stone-950/70 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-md">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{(org.rating_avg ?? 5.0).toFixed(1)}</span>
                      <span className="text-[10px] text-stone-300">({org.review_count ?? 0})</span>
                    </div>
                  </div>

                  <div className="pt-3.5">
                    <h3 className="text-base font-bold text-stone-950 group-hover:text-amber-700 transition-colors">
                      {org.name}
                    </h3>
                    {org.physical_address && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-stone-500 line-clamp-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span className="truncate">{org.physical_address}</span>
                        {typeof org.distance_km === 'number' && (
                          <span className="shrink-0 font-semibold text-amber-800">
                            •{' '}
                            {org.distance_km < 1
                              ? `${Math.round(org.distance_km * 1000)}m away`
                              : `${org.distance_km.toFixed(1)} km away`}
                          </span>
                        )}
                      </p>
                    )}
                    {org.description && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone-600">
                        {org.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <Link
                    href={`/client/org/${org.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 transition-colors hover:text-amber-800"
                  >
                    <span>Visit Salon</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onSelectOrganization(org.id)}
                    className="cursor-pointer rounded-full bg-stone-950 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
                  >
                    View Treatments
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Featured Services Grid */}
      {(activeTab === 'services' || activeOrgs.length === 0) && activeSvcs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeSvcs.map((item) => {
            const svc = item.service
            const price = Number(svc.base_price) || 0
            const coverSrc =
              typeof svc.images?.cover === 'string' ? svc.images.cover : serviceImage(svc.id)

            // Convert to SalonService shape for actions
            const salonServiceObj: SalonService = {
              id: svc.id,
              name: svc.name,
              category: (svc.category_name || 'Haircuts') as SalonService['category'],
              durationMin: svc.duration_minutes,
              price,
              holdDeposit: Number(svc.authorization_hold_amount) || price,
              noShowFee: Math.round(price * 0.5),
              description: svc.description || 'Signature treatment',
              popular: true,
              imageUrl: coverSrc,
              organizationId: svc.organization_id,
              organizationName: svc.organization_name || undefined,
              rating:
                typeof svc.rating_avg === 'number' && svc.rating_avg > 0
                  ? svc.rating_avg
                  : undefined,
              reviewsCount: svc.review_count || 0,
              isFeatured: true,
              featuredBadge: item.badge_text,
            }

            return (
              <article
                key={item.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-4 shadow-xs transition-all hover:border-amber-400 hover:shadow-md"
              >
                <div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-stone-100">
                    <Image
                      src={coverSrc}
                      alt={svc.name}
                      fill
                      unoptimized={shouldUnoptimizeImage(coverSrc)}
                      className="object-cover transition-transform duration-500 group-hover:scale-104"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />

                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                        <Sparkles className="h-3 w-3" />
                        {item.badge_text}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-stone-950/70 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>{svc.duration_minutes}m</span>
                    </div>

                    {typeof svc.rating_avg === 'number' && svc.rating_avg > 0 && (
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-stone-950/70 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-md">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{svc.rating_avg.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        {svc.category_name || 'Treatment'}
                      </span>
                      <span className="text-lg font-extrabold text-stone-950">${price}</span>
                    </div>

                    <h3 className="text-base font-bold text-stone-950 group-hover:text-amber-700 transition-colors">
                      {svc.name}
                    </h3>
                    {svc.organization_name && (
                      <p className="mt-0.5 text-xs font-medium text-stone-500">
                        {svc.organization_name}
                      </p>
                    )}
                    {svc.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-stone-600">
                        {svc.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAskAiService(salonServiceObj)}
                    title="Ask AI Concierge about this service"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickBookService(salonServiceObj)}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-stone-950 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
                  >
                    <Lock className="h-3 w-3 text-amber-400" />
                    <span>$0 Hold Checkout</span>
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
