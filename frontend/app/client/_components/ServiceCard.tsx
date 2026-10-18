'use client'

import { ArrowRight, Clock, Info, Lock, Sparkles } from 'lucide-react'
import Image from 'next/image'

import { serviceImage } from '@/lib/data/service-content'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import type { SalonService } from '@/types'

interface ServiceCardProps {
  service: SalonService
  onAskAi: (service: SalonService) => void
  onQuickBook: (service: SalonService) => void
  onOpenProtocol: (service: SalonService) => void
}

export function ServiceCard({ service, onAskAi, onQuickBook, onOpenProtocol }: ServiceCardProps) {
  const coverSrc = service.imageUrl || serviceImage(service.id)
  const distanceLabel =
    typeof service.distanceKm === 'number'
      ? service.distanceKm < 1
        ? `${Math.round(service.distanceKm * 1000)} m`
        : `${service.distanceKm.toFixed(1)} km`
      : null

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

        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 font-bold text-[11px] text-stone-950 backdrop-blur-md">
            <Lock className="h-3 w-3 text-amber-600" />
            <span>${service.holdDeposit} Hold • $0 Today</span>
          </span>
        </div>

        <div className="absolute top-3 right-3">
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
