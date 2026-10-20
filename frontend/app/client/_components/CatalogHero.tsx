'use client'

import { ArrowUpRight, Store } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Skeleton } from '@/components/ui/skeleton'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import type { CatalogHero as CatalogHeroData } from '@/types/api-org'

interface CatalogHeroProps {
  hero?: CatalogHeroData | null
  isLoading?: boolean
}

export function CatalogHero({ hero, isLoading }: CatalogHeroProps) {
  if (isLoading || !hero) {
    return (
      <section className="mb-8 pt-2 sm:mb-12 sm:pt-4">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-4 lg:col-span-7">
            <Skeleton className="h-3 w-40 rounded-full bg-stone-200/80" />
            <Skeleton className="h-12 w-full max-w-xl rounded-lg bg-stone-200/80" />
            <Skeleton className="h-16 w-full max-w-lg rounded-lg bg-stone-200/70" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-28 rounded-full bg-stone-200/70" />
              <Skeleton className="h-7 w-24 rounded-full bg-stone-200/70" />
            </div>
          </div>
          <Skeleton className="aspect-[4/3] w-full rounded-3xl bg-stone-200/80 lg:col-span-5 lg:aspect-[4/5]" />
        </div>
      </section>
    )
  }

  const orgDetailHref = hero.organization_id ? `/client/org/${hero.organization_id}` : '#services'

  const heroVisual = (
    <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-stone-100 shadow-md transition-all duration-300 hover:shadow-xl lg:aspect-[4/5]">
      {hero.image_url ? (
        <Image
          src={hero.image_url}
          alt={hero.image_alt || hero.organization_name || 'Salon'}
          fill
          priority
          unoptimized={shouldUnoptimizeImage(hero.image_url)}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 45vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-200 via-stone-100 to-amber-50" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent transition-opacity group-hover:from-stone-950/90" />

      {/* Floating Explore Pill on Hover */}
      {hero.organization_id && (
        <div className="absolute top-4 right-4 z-10 transition-transform duration-300 group-hover:scale-105">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 font-bold text-xs text-stone-900 shadow-md backdrop-blur-md">
            <span>Explore Salon</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-amber-700" />
          </span>
        </div>
      )}

      {(hero.organization_name || hero.physical_address) && (
        <div className="absolute right-4 bottom-4 left-4 z-10 text-white">
          {hero.organization_name ? (
            <div className="flex items-center gap-1.5 font-bold text-sm drop-shadow-xs transition-colors group-hover:text-amber-200 sm:text-base">
              <span>{hero.organization_name}</span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-amber-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          ) : null}
          {hero.physical_address ? (
            <div className="mt-0.5 text-stone-300 text-xs">{hero.physical_address}</div>
          ) : null}
        </div>
      )}
    </div>
  )

  return (
    <section className="mb-8 pt-2 sm:mb-12 sm:pt-4">
      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col justify-center lg:col-span-7">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="truncate font-bold text-[11px] text-stone-500 uppercase tracking-widest">
              {hero.eyebrow}
            </span>
          </div>

          <h1 className="text-balance font-extrabold text-[1.75rem] text-stone-950 leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            {hero.headline}{' '}
            <span className="font-normal font-serif italic text-amber-700">{hero.highlight}</span>
          </h1>

          <p className="mt-3 line-clamp-3 max-w-xl text-sm text-stone-600 leading-relaxed sm:mt-4 sm:line-clamp-none sm:text-base">
            {hero.subtitle}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-700 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              $0 Debited Today
            </span>
            {hero.salon_count > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-700 text-xs">
                {hero.salon_count} salons
              </span>
            ) : null}
            {hero.service_count > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-700 text-xs">
                {hero.service_count} services
              </span>
            ) : null}
            {hero.organization_id && hero.organization_name && (
              <Link
                href={`/client/org/${hero.organization_id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-900 text-xs transition-colors hover:bg-amber-100"
              >
                <Store className="h-3 w-3 text-amber-700" />
                <span>Featured: {hero.organization_name}</span>
                <ArrowUpRight className="h-3 w-3 text-amber-700" />
              </Link>
            )}
            {hero.physical_address ? (
              <span className="hidden items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-700 text-xs sm:inline-flex">
                {hero.physical_address}
              </span>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-5">
          {hero.organization_id ? (
            <Link
              href={orgDetailHref}
              aria-label={`View ${hero.organization_name || 'salon'} details and services`}
              className="block cursor-pointer focus:outline-hidden"
            >
              {heroVisual}
            </Link>
          ) : (
            heroVisual
          )}
        </div>
      </div>
    </section>
  )
}
