'use client'

import { Check, Loader2, Sparkles, Star, User } from 'lucide-react'
import Image from 'next/image'
import React, { useMemo, useState } from 'react'

import { ANY_AVAILABLE_STYLIST } from '@/lib/data/catalog'
import { serviceImage } from '@/lib/data/service-content'
import { formatDuration, formatUsd } from '@/lib/format'
import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'
import { cn } from '@/lib/utils'
import type { SalonService, StaffMember } from '@/types'

import { StylistPicker } from './StylistPicker'

export interface MultiServiceStylistPickerProps {
  services: SalonService[]
  serviceStylistMap: Record<string, StaffMember>
  onSelectServiceStylist: (serviceId: string, stylist: StaffMember) => void
  onApplyStylistToAll: (stylist: StaffMember) => void
  staffOptions: StaffMember[]
  isLoading?: boolean
}

export function MultiServiceStylistPicker({
  services,
  serviceStylistMap,
  onSelectServiceStylist,
  onApplyStylistToAll,
  staffOptions,
  isLoading,
}: MultiServiceStylistPickerProps) {
  const [activeServiceId, setActiveServiceId] = useState<string>(services[0]?.id ?? '')

  const eligibleStaff = useMemo(
    () => staffOptions.filter((s) => !s.role?.toLowerCase().includes('owner')),
    [staffOptions],
  )
  const choices = [ANY_AVAILABLE_STYLIST, ...eligibleStaff]

  // If only 1 service, render the standard StylistPicker
  if (services.length <= 1) {
    const singleService = services[0]
    const currentStylist =
      (singleService ? serviceStylistMap[singleService.id] : null) ?? ANY_AVAILABLE_STYLIST
    return (
      <StylistPicker
        stylist={currentStylist}
        staffOptions={staffOptions}
        isLoading={isLoading}
        onSelect={(staff) => {
          if (singleService) {
            onSelectServiceStylist(singleService.id, staff)
          }
        }}
      />
    )
  }

  const activeService = services.find((s) => s.id === activeServiceId) || services[0]
  const currentSelectedForActive = serviceStylistMap[activeService.id] ?? ANY_AVAILABLE_STYLIST

  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-200">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-stone-950">Select Stylist Per Service</h2>
          <p className="mt-1 text-sm text-stone-500">
            Choose a specialist for each service in your multi-service appointment.
          </p>
        </div>

        {/* Quick action: Apply same stylist to all */}
        <div className="relative inline-block">
          <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
            Same stylist for all?
          </label>
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Assign one stylist to all services"
              onChange={(e) => {
                const found = choices.find((s) => s.id === e.target.value)
                if (found) onApplyStylistToAll(found)
              }}
              defaultValue=""
              className="h-8 rounded-full border border-stone-200 bg-white px-3 text-xs font-medium text-stone-700 shadow-2xs focus:border-stone-950 focus:outline-none"
            >
              <option value="" disabled>
                Assign to all…
              </option>
              {choices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id === ANY_AVAILABLE_STYLIST.id ? 'Any available stylist' : c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services List / Tabs */}
      <div className="mb-6 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Services ({services.length}) — Click to configure stylist
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => {
            const assigned = serviceStylistMap[svc.id] ?? ANY_AVAILABLE_STYLIST
            const isActive = svc.id === activeService.id
            const isAny = assigned.id === ANY_AVAILABLE_STYLIST.id
            const img = svc.imageUrl || serviceImage(svc.id)

            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => setActiveServiceId(svc.id)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-3 text-left transition-all cursor-pointer',
                  isActive
                    ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-600'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60',
                )}
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                  <Image
                    src={img}
                    alt=""
                    fill
                    unoptimized={shouldUnoptimizedImage(img)}
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-stone-900">{svc.name}</p>
                  <p className="text-[11px] text-stone-500">
                    {formatDuration(svc.durationMin)} · {formatUsd(svc.price)}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-800">
                    <User className="h-3 w-3 shrink-0 text-amber-700" />
                    <span className="truncate">{isAny ? 'Any available' : assigned.name}</span>
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Stylist Options for Active Service */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-2xs">
        <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Assigning stylist for:
            </span>
            <h3 className="font-semibold text-stone-900 text-base">{activeService.name}</h3>
          </div>
          <span className="text-xs text-stone-500">
            {formatDuration(activeService.durationMin)}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-stone-50 py-12 text-sm text-stone-500">
            <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
            Loading salon team…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {choices.map((staff) => {
              const selected = currentSelectedForActive.id === staff.id
              const isAny = staff.id === ANY_AVAILABLE_STYLIST.id
              return (
                <button
                  key={staff.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelectServiceStylist(activeService.id, staff)}
                  className={cn(
                    'relative flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99]',
                    selected
                      ? 'border-stone-950 bg-stone-50/50 shadow-xs ring-1 ring-stone-950'
                      : 'border-stone-200 bg-white hover:border-amber-300 hover:shadow-2xs',
                  )}
                >
                  {staff.avatar ? (
                    <Image
                      src={staff.avatar}
                      alt=""
                      width={44}
                      height={44}
                      unoptimized={shouldUnoptimizedImage(staff.avatar)}
                      className="h-11 w-11 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700">
                      <Sparkles className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1 pr-6">
                    <span className="block truncate text-xs font-semibold text-stone-950">
                      {isAny ? 'Any available stylist' : staff.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-stone-500">
                      {staff.role}
                    </span>
                    {staff.rating > 0 ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-stone-600">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{staff.rating.toFixed(2)}</span>
                        <span className="text-stone-400">({staff.reviewsCount})</span>
                      </span>
                    ) : (
                      <span className="mt-1 block text-[11px] text-emerald-700">
                        Most availability
                      </span>
                    )}
                  </div>
                  {selected && (
                    <span className="absolute top-3.5 right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-950 text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
