'use client'

import { Clock, Scissors, SquarePen, Users } from 'lucide-react'
import Image from 'next/image'

import { StatusBadge } from '@/components/badge/StatusBadge'
import { Button, Card } from '@/components/ui'
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
    <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_12px_24px_-8px_rgba(14,165,233,0.14),0_4px_12px_-2px_rgba(0,0,0,0.03)]">
      {/* Decorative top accent line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 transition-opacity duration-200 opacity-70 group-hover:opacity-100" />

      <div className="space-y-3.5">
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-xs border border-slate-200/60 text-sky-800 transition-transform duration-300 group-hover:scale-105">
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
          <div className="flex items-center justify-between gap-1.5">
            <h3 className="font-bold text-base text-slate-900 tracking-tight transition-colors group-hover:text-sky-900 truncate">
              {service.name}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[32px]">
            {service.description || 'Professional service with guaranteed booking protection.'}
          </p>
        </div>

        {/* Price & Capacity Strip */}
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
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

      {/* Footer Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200/70 bg-slate-50/80 px-2.5 py-1 text-[11px] font-mono text-slate-500 transition-colors hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-900 cursor-pointer"
          title="Service ID"
        >
          <span>ID: {service.id.slice(0, 8)}</span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(service)}
            title="Edit service details"
            className="h-8 gap-1.5 rounded-xl border-slate-200/90 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900 shadow-2xs transition-all active:scale-95"
          >
            <SquarePen className="h-3.5 w-3.5 text-slate-500" />
            <span>Edit</span>
          </Button>

          {service.status !== 'inactive' ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeactivate(service)}
              title="Deactivate service"
              disabled={isDeactivating}
              className="h-8 w-8 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-transparent transition-all active:scale-95"
            >
              <Clock className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
