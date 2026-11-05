'use client'

import { Check, Clock, Plus, X } from 'lucide-react'
import Image from 'next/image'

import { serviceImage } from '@/lib/data/service-content'
import { formatDuration, formatUsd } from '@/lib/format'
import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'
import type { SalonService } from '@/types'

export interface ServiceSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  availableServices: SalonService[]
  selectedServices: SalonService[]
  onToggleService: (service: SalonService) => void
}

export function ServiceSelectionModal({
  isOpen,
  onClose,
  availableServices,
  selectedServices,
  onToggleService,
}: ServiceSelectionModalProps) {
  if (!isOpen) return null

  const selectedIds = new Set(selectedServices.map((s) => s.id))
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMin, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-stone-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 p-5 sm:px-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Customize Appointment
            </span>
            <h3 className="font-serif text-xl font-medium text-stone-950">Select Salon Services</h3>
            <p className="mt-0.5 text-xs text-stone-500">
              Choose one or more treatments to combine into a single appointment.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Services List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-stone-100 space-y-2">
          {availableServices.map((svc) => {
            const isSelected = selectedIds.has(svc.id)
            const isOnlySelected = isSelected && selectedServices.length === 1
            const coverSrc = svc.imageUrl || serviceImage(svc.id)

            return (
              <div
                key={svc.id}
                className={`flex items-center justify-between gap-3 rounded-2xl p-3 transition-colors ${
                  isSelected ? 'bg-amber-50/70 border border-amber-200/80' : 'hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    <Image
                      src={coverSrc}
                      alt=""
                      fill
                      unoptimized={shouldUnoptimizedImage(coverSrc)}
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm text-stone-950 truncate">{svc.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-stone-400" />
                        {formatDuration(svc.durationMin)}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-stone-900">{formatUsd(svc.price)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isOnlySelected}
                  onClick={() => onToggleService(svc)}
                  title={isOnlySelected ? 'At least one service is required' : undefined}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'bg-stone-950 text-white hover:bg-rose-700 disabled:opacity-50 disabled:hover:bg-stone-950'
                      : 'border border-stone-200 bg-white text-stone-700 hover:border-amber-300 hover:bg-amber-50/50'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50 p-4 sm:px-6">
          <div className="text-xs">
            <span className="font-bold text-stone-900">
              {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
            </span>
            <span className="mx-1 text-stone-300">·</span>
            <span className="text-stone-600">{formatDuration(totalDuration)}</span>
            <span className="mx-1 text-stone-300">·</span>
            <span className="font-semibold text-stone-900">{formatUsd(totalPrice)}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-stone-950 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Apply &amp; Continue
          </button>
        </div>
      </div>
    </div>
  )
}
