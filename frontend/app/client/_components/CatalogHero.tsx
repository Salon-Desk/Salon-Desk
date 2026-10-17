'use client'

import Image from 'next/image'

import { Skeleton } from '@/components/ui/skeleton'
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

  return (
    <section className="mb-8 pt-2 sm:mb-12 sm:pt-4">
      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col justify-center lg:col-span-7">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="truncate text-[11px] font-bold uppercase tracking-widest text-stone-500">
              {hero.eyebrow}
            </span>
          </div>

          <h1 className="text-[1.75rem] font-extrabold leading-[1.1] tracking-tight text-balance text-stone-950 sm:text-5xl lg:text-6xl">
            {hero.headline}{' '}
            <span className="font-serif font-normal italic text-amber-700">{hero.highlight}</span>
          </h1>

          <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-relaxed text-stone-600 sm:mt-4 sm:line-clamp-none sm:text-base">
            {hero.subtitle}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              $0 Debited Today
            </span>
            {hero.salon_count > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                {hero.salon_count} salons
              </span>
            ) : null}
            {hero.service_count > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                {hero.service_count} services
              </span>
            ) : null}
            {hero.physical_address ? (
              <span className="hidden items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 sm:inline-flex">
                {hero.physical_address}
              </span>
            ) : null}
          </div>
        </div>

        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-stone-100 lg:col-span-5 lg:aspect-[4/5]">
          {hero.image_url ? (
            <Image
              src={hero.image_url}
              alt={hero.image_alt || hero.organization_name || 'Salon'}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-200 via-stone-100 to-amber-50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent" />
          {(hero.organization_name || hero.physical_address) && (
            <div className="absolute bottom-4 left-4 right-4 text-white">
              {hero.organization_name ? (
                <div className="text-xs font-semibold">{hero.organization_name}</div>
              ) : null}
              {hero.physical_address ? (
                <div className="text-[11px] text-stone-300">{hero.physical_address}</div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
