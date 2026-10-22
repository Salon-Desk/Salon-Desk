'use client'

import { Building2, CheckCircle2, ShieldCheck, Star } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

import type {
  AgentConfirmedBooking,
  AgentOrganizationRecommendation,
  AgentServiceRecommendation,
} from '@/components/chat/useAgentChat'
import { SERVICE_IMAGE_FALLBACK } from '@/lib/data/service-content'
import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'

/**
 * Service recommendation card rendered inside assistant turn.
 */
export function ServiceCard({
  service,
  onSelect,
  index,
}: {
  service: AgentServiceRecommendation
  onSelect: (service: AgentServiceRecommendation) => void
  index?: number
}) {
  const meta = [
    service.durationMinutes ? `${service.durationMinutes} min` : null,
    service.distanceKm != null ? `${service.distanceKm} km` : null,
    service.categoryName,
  ].filter(Boolean)

  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      className="group flex w-full items-center gap-3 rounded-2xl border border-stone-200/90 bg-white p-2.5 text-left shadow-2xs transition-all hover:border-amber-300 hover:shadow-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-stone-100">
        <Image
          src={service.imageUrl || service.organizationPicture || SERVICE_IMAGE_FALLBACK}
          alt=""
          fill
          unoptimized={shouldUnoptimizedImage(
            service.imageUrl || service.organizationPicture || SERVICE_IMAGE_FALLBACK,
          )}
          sizes="48px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {typeof index === 'number' && (
          <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-stone-950/80 text-[9px] font-bold text-white">
            {index}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="truncate text-[13px] font-semibold text-stone-950 group-hover:text-amber-900">
            {service.name}
          </h4>
          <span className="shrink-0 font-mono text-[13px] font-bold tabular-nums text-stone-950">
            ${service.basePrice}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] font-medium text-stone-500">
          {service.organizationName}
        </p>
        {meta.length > 0 && (
          <p className="mt-0.5 truncate text-[11px] text-stone-400">{meta.join(' · ')}</p>
        )}
      </div>

      <span className="inline-flex shrink-0 items-center rounded-full bg-stone-950 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors group-hover:bg-amber-600">
        Book
      </span>
    </button>
  )
}

/**
 * Organization recommendation card rendered when user asks for salons/spas.
 */
export function OrganizationCard({
  org,
  onShowServices,
}: {
  org: AgentOrganizationRecommendation
  onShowServices: (orgName: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onShowServices(org.name)}
      className="group flex w-full items-center gap-3 rounded-2xl border border-stone-200/90 bg-white p-2.5 text-left shadow-2xs transition-all hover:border-amber-300 hover:shadow-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-100 bg-amber-50">
        {org.picture ? (
          <Image
            src={org.picture}
            alt=""
            fill
            unoptimized={shouldUnoptimizedImage(org.picture)}
            sizes="44px"
            className="object-cover"
          />
        ) : (
          <Building2 className="h-5 w-5 text-amber-700" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <h4 className="truncate text-[13px] font-semibold text-stone-950 group-hover:text-amber-900">
            {org.name}
          </h4>
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-stone-500">
          <span className="inline-flex items-center font-medium text-amber-800">
            <Star className="mr-0.5 h-3 w-3 fill-amber-400 text-amber-500" />
            {org.rating || 4.9}
          </span>
          {org.distanceKm != null && <span>{org.distanceKm} km</span>}
          {org.physicalAddress && <span className="truncate">{org.physicalAddress}</span>}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-950">
        See services
      </span>
    </button>
  )
}

/**
 * Booking confirmation card inside client concierge chat.
 */
export function ConfirmedBookingCard({ booking }: { booking: AgentConfirmedBooking }) {
  return (
    <div className="w-full rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-3.5 text-stone-900 shadow-[0_1px_2px_rgba(6,95,70,0.06)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200">
      <div className="mb-1.5 flex items-center gap-1.5 text-emerald-800">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span className="text-[11px] font-semibold">You are booked</span>
      </div>
      <h4 className="text-sm font-semibold text-stone-950">{booking.serviceName}</h4>
      {booking.organizationName && (
        <p className="mt-0.5 text-xs text-stone-500">at {booking.organizationName}</p>
      )}
      <div className="mt-2 flex items-center justify-between border-t border-emerald-100 pt-2 text-xs">
        <span className="font-medium text-stone-600">
          {booking.formattedTime || booking.startsAt}
        </span>
        <span className="font-medium text-emerald-800">$0 today (PayPal hold)</span>
      </div>
    </div>
  )
}
