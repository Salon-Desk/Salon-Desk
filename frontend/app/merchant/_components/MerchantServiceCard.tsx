'use client'

import { Clock, Scissors, SquarePen, Users } from 'lucide-react'
import Image from 'next/image'

import { StatusBadge } from '@/components/badge/StatusBadge'
import { IconButton } from '@/components/ui'
import PrimaryButton from '@/components/ui/primary-button'
import { formatUsd } from '@/lib/format'
import { resolveImageSrc, shouldUnoptimizedImage } from '@/lib/util/remoteImage'
import type { ApiOrgService } from '@/types/api-org'

interface MerchantServiceCardProps {
  service: ApiOrgService
  categoryName?: string
  onEdit: (service: ApiOrgService) => void
  onDeactivate: (service: ApiOrgService) => void
  isDeactivating?: boolean
}

export function MerchantServiceCard({
  service,
  categoryName = 'General Service',
  onEdit,
  onDeactivate,
  isDeactivating = false,
}: MerchantServiceCardProps) {
  const isActive = service.status === 'active'

  const coverSrc =
    service.images &&
    typeof service.images === 'object' &&
    'cover' in service.images &&
    service.images.cover
      ? (service.images.cover as string)
      : null

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100/50">
      <div className="space-y-3 p-4">
        {/* Cover Media or Stylized Placeholder */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-slate-100 via-sky-50/40 to-slate-100">
          {coverSrc ? (
            <Image
              src={resolveImageSrc(coverSrc)}
              alt={service.name}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              unoptimized={shouldUnoptimizedImage(coverSrc)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-xs border border-slate-200/60 text-sky-800">
                <Scissors className="h-6 w-6 stroke-[1.75]" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase">
                {service.name.slice(0, 3)}
              </span>
            </div>
          )}

          {/* Floating Category Pill on top left */}
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-slate-800 tracking-wide shadow-xs backdrop-blur-md border border-slate-200/60">
              {categoryName}
            </span>
          </div>

          {/* Floating Status Badge on top right */}
          <div className="absolute top-2.5 right-2.5">
            <StatusBadge tone={isActive ? 'emerald' : 'slate'} size="sm" dot>
              {service.status || 'Active'}
            </StatusBadge>
          </div>

          {/* Floating Duration overlay on bottom right */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[11px] font-mono font-medium text-white shadow-xs backdrop-blur-md">
            <Clock className="h-3 w-3 text-sky-300" />
            <span>{service.duration_minutes}m</span>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-bold text-base text-slate-900 tracking-tight transition-colors group-hover:text-sky-900 line-clamp-1">
            {service.name}
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[32px]">
            {service.description || 'Professional service with guaranteed booking protection.'}
          </p>
        </div>

        {/* Price & Capacity Strip */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50/80 p-2.5 border border-slate-100">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Base Price
            </span>
            <span className="font-mono font-extrabold text-base text-slate-900">
              {formatUsd(Number(service.base_price))}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Capacity
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-slate-700">
              <Users className="h-3 w-3 text-slate-400" />
              {service.simultaneous_capacity}{' '}
              {service.simultaneous_capacity > 1 ? 'chairs' : 'chair'}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer with Actions */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-4 py-2.5">
        <span className="font-mono text-[11px] text-slate-400">ID: {service.id.slice(0, 8)}</span>

        <div className="flex items-center gap-1.5">
          <IconButton
            aria-label="Edit service"
            onClick={() => onEdit(service)}
            title="Edit service"
            className="h-8 w-8 rounded-lg text-slate-600 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 transition-colors"
          >
            <SquarePen className="h-3.5 w-3.5" />
          </IconButton>
          {service.status !== 'inactive' ? (
            <PrimaryButton
              title="Deactivate"
              variant="ghost"
              size="sm"
              fullWidth={false}
              isDisabled={isDeactivating}
              className="h-7.5 rounded-lg px-2.5 text-xs text-slate-500 hover:text-rose-700 hover:bg-rose-50/60"
              onClick={() => onDeactivate(service)}
            />
          ) : null}
        </div>
      </div>
    </article>
  )
}
