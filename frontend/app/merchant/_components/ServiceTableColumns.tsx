import { Clock, Edit2 } from 'lucide-react'
import Image from 'next/image'

import { StatusBadge } from '@/components/badge/StatusBadge'
import { IconButton } from '@/components/ui'
import PrimaryButton from '@/components/ui/primary-button'
import { formatUsd } from '@/lib/format'
import { resolveImageSrc, shouldUnoptimizedImage } from '@/lib/util/remoteImage'
import type { ApiOrgService } from '@/types/api-org'
import type { ColumnDefinition } from '@/types/table'

interface ServiceTableColumnsProps {
  categoryNameById: Map<string, string>
  onEdit: (service: ApiOrgService) => void
  onDeactivate: (service: ApiOrgService) => void
  isDeactivating: boolean
}

export function getServiceTableColumns({
  categoryNameById,
  onEdit,
  onDeactivate,
  isDeactivating,
}: ServiceTableColumnsProps): ColumnDefinition<ApiOrgService>[] {
  return [
    {
      id: 'service',
      header: 'Service',
      cell: (service) => {
        const coverSrc =
          service.images &&
          typeof service.images === 'object' &&
          'cover' in service.images &&
          service.images.cover
            ? (service.images.cover as string)
            : null

        return (
          <div className="flex items-center gap-3">
            {coverSrc ? (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <Image
                  src={resolveImageSrc(coverSrc)}
                  alt={service.name}
                  fill
                  className="object-cover"
                  unoptimized={shouldUnoptimizedImage(coverSrc)}
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200/60">
                {service.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-xs truncate max-w-[200px]">
                {service.name}
              </div>
              <div className="text-[11px] text-amber-800 font-medium truncate max-w-[200px]">
                {categoryNameById.get(service.service_category_id) || 'General Service'}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      id: 'price',
      header: 'Base Price',
      cell: (service) => (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {formatUsd(Number(service.base_price))}
        </span>
      ),
    },
    {
      id: 'duration',
      header: 'Duration',
      cell: (service) => (
        <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-600">
          <Clock className="h-3 w-3 text-slate-400" />
          {service.duration_minutes}m
        </span>
      ),
    },
    {
      id: 'capacity',
      header: 'Capacity',
      cell: (service) => (
        <span className="font-mono text-xs text-slate-600">
          {service.simultaneous_capacity} chair{service.simultaneous_capacity > 1 ? 's' : ''}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (service) => {
        const isActive = service.status === 'active'
        return (
          <StatusBadge tone={isActive ? 'emerald' : 'slate'} size="sm" dot>
            {service.status || 'Active'}
          </StatusBadge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (service) => (
        <div className="flex items-center justify-end gap-1.5">
          <IconButton
            aria-label="Edit service"
            onClick={() => onEdit(service)}
            className="h-8 w-8 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
            title="Edit service"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </IconButton>
          {service.status !== 'inactive' ? (
            <PrimaryButton
              title="Deactivate"
              variant="ghost"
              size="sm"
              fullWidth={false}
              isDisabled={isDeactivating}
              className="h-7.5 rounded-lg px-2.5 text-xs text-slate-500 hover:text-rose-700"
              onClick={() => onDeactivate(service)}
            />
          ) : null}
        </div>
      ),
    },
  ]
}
