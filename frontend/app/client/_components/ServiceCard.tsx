'use client'

import { ArrowRight, Clock, Info, Lock, Sparkles, Star } from 'lucide-react'
import Image from 'next/image'

import { serviceImage } from '@/lib/data/service-content'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import type { SalonService } from '@/types'

interface ServiceCardProps {
  service: SalonService
  viewMode?: 'grid' | 'list'
  onAskAi: (service: SalonService) => void
  onQuickBook: (service: SalonService) => void
  onOpenProtocol: (service: SalonService) => void
}

export function ServiceCard({
  service,
  viewMode = 'grid',
  onAskAi,
  onQuickBook,
  onOpenProtocol,
}: ServiceCardProps) {
  const coverSrc = service.imageUrl || serviceImage(service.id)
  const distanceLabel =
    typeof service.distanceKm === 'number'
      ? service.distanceKm < 1
        ? `${Math.round(service.distanceKm * 1000)} m`
        : `${service.distanceKm.toFixed(1)} km`
      : null

  const hasRating = typeof service.rating === 'number' && service.rating > 0
  const ratingVal = hasRating ? (service.rating as number) : null
  const reviewsCount = service.reviewsCount ?? 0

  if (viewMode === 'list') {
    return (
      <article className="group flex flex-col sm:flex-row items-stretch gap-4 rounded-3xl border border-stone-200/80 bg-white p-3.5 shadow-xs transition-all hover:border-amber-300 hover:shadow-md">
        {/* Thumbnail on left */}
        <div className="relative aspect-[16/10] sm:aspect-square w-full sm:w-44 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
          <Image
            src={coverSrc}
            alt={service.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-104"
            referrerPolicy="no-referrer"
            unoptimized={shouldUnoptimizeImage(coverSrc)}
            sizes="(max-width: 640px) 100vw, 180px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent" />

          {service.isFeatured && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2.5 py-0.5 font-extrabold text-[10px] text-white uppercase tracking-wider shadow-xs">
                <Sparkles className="h-3 w-3" />
                <span>{service.featuredBadge || 'Featured'}</span>
              </span>
            </div>
          )}

          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-stone-950/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
            <Clock className="h-3 w-3 text-amber-400" />
            <span>{service.durationMin}m</span>
          </div>
        </div>

        {/* Center Details */}
        <div className="flex flex-1 flex-col justify-between py-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                {service.category}
              </span>
              {ratingVal !== null ? (
                <>
                  <span className="text-stone-300">•</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>{ratingVal.toFixed(1)}</span>
                    {reviewsCount > 0 && (
                      <span className="text-[11px] text-stone-400 font-normal">
                        ({reviewsCount})
                      </span>
                    )}
                  </div>
                </>
              ) : null}
              {distanceLabel && (
                <>
                  <span className="text-stone-300">•</span>
                  <span className="text-[11px] text-stone-400">{distanceLabel}</span>
                </>
              )}
            </div>

            <h3 className="text-base font-bold text-stone-950 transition-colors group-hover:text-amber-700 mt-1">
              {service.name}
            </h3>

            {service.organizationName && (
              <p className="text-xs font-semibold text-stone-500 mt-0.5">
                {service.organizationName}
              </p>
            )}

            <p className="mt-1.5 text-xs text-stone-500 line-clamp-2 leading-relaxed">
              {service.description}
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-800">
              <Lock className="h-3 w-3 text-amber-600" />
              <span>${service.holdDeposit} Hold • $0 Debited Today</span>
            </span>
            <button
              type="button"
              onClick={() => onOpenProtocol(service)}
              className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 underline cursor-pointer"
            >
              Protocol
            </button>
          </div>
        </div>

        {/* Right Pricing & Actions */}
        <div className="flex sm:flex-col justify-between sm:justify-center sm:items-end gap-3 shrink-0 pt-3 sm:pt-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-stone-100">
          <div className="text-left sm:text-right">
            <span className="text-xs text-stone-400 block">Total Service</span>
            <span className="text-xl font-extrabold text-stone-950">${service.price}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAskAi(service)}
              title="Ask AI Concierge"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-stone-800 hover:bg-stone-200 transition-colors"
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
            </button>
            <button
              type="button"
              onClick={() => onQuickBook(service)}
              className="cursor-pointer rounded-full bg-stone-950 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-amber-600 shadow-xs"
            >
              Book Now
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-stone-100 sm:aspect-[16/11]">
        <Image
          src={coverSrc}
          alt={service.name}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-104"
          referrerPolicy="no-referrer"
          unoptimized={shouldUnoptimizeImage(coverSrc)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 font-bold text-[11px] text-stone-950 backdrop-blur-md">
            <Lock className="h-3 w-3 text-amber-600" />
            <span>${service.holdDeposit} Hold • $0 Today</span>
          </span>

          {service.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/90 px-2.5 py-0.5 font-extrabold text-[10px] text-white uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              <span>{service.featuredBadge || 'Featured'}</span>
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {ratingVal !== null && (
            <div className="flex items-center gap-1 rounded-full bg-stone-950/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{ratingVal.toFixed(1)}</span>
              {reviewsCount > 0 && (
                <span className="text-[10px] text-stone-300 font-normal">({reviewsCount})</span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => onOpenProtocol(service)}
            title="View Treatment Protocol"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-stone-950/50 text-white backdrop-blur-md transition-colors hover:bg-stone-950"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-950/60 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
            <Clock className="h-3 w-3 text-amber-400" />
            <span>{service.durationMin}m</span>
          </span>
          {distanceLabel ? (
            <span className="inline-flex items-center rounded-full bg-stone-950/60 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
              {distanceLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between pt-3.5">
        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              {service.category}
            </span>
            <span className="text-xl font-extrabold text-stone-950">${service.price}</span>
          </div>

          <h2 className="text-base font-bold leading-snug text-stone-950 transition-colors group-hover:text-amber-700">
            {service.name}
          </h2>

          {service.organizationName ? (
            <p className="mt-0.5 text-[11px] font-medium text-stone-500">
              {service.organizationName}
            </p>
          ) : null}

          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">
            {service.description}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => onQuickBook(service)}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-stone-950 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-amber-600"
          >
            <span>Book Now</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={() => onAskAi(service)}
            className="flex cursor-pointer items-center justify-center gap-1 rounded-full bg-stone-100 px-3.5 py-2.5 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-200"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>AI</span>
          </button>
        </div>
      </div>
    </article>
  )
}
