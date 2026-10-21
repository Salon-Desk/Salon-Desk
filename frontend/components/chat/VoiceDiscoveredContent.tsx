'use client'

import { ConnectionState } from 'livekit-client'
import { Building2, CalendarCheck, Clock, MapPin, ShieldCheck, Sparkles, Star } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React from 'react'

import type {
  AgentOrganizationRecommendation,
  AgentServiceRecommendation,
} from '@/components/chat/useAgentChat'
import { SERVICE_IMAGE_FALLBACK } from '@/lib/data/service-content'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'

export interface PaymentLinkData {
  bookingId: string
  serviceName: string
  organizationName: string
  formattedTime: string
  totalPrice: string
  paymentLink: string
}

export interface VoiceDiscoveredContentProps {
  paymentLinkData: PaymentLinkData | null
  setPaymentLinkData: (data: PaymentLinkData | null) => void
  visibleOrgs: AgentOrganizationRecommendation[]
  visibleServices: AgentServiceRecommendation[]
  canShowMoreServices: boolean
  isSending: boolean
  connectionState: ConnectionState
  onSend: (text: string) => Promise<void> | void
}

export function VoiceDiscoveredContent({
  paymentLinkData,
  setPaymentLinkData,
  visibleOrgs,
  visibleServices,
  canShowMoreServices,
  isSending,
  connectionState,
  onSend,
}: VoiceDiscoveredContentProps) {
  const router = useRouter()

  return (
    <>
      {/* Payment Link Card (When present) */}
      {paymentLinkData && (
        <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 p-3.5 text-stone-900 shadow-[0_1px_2px_rgba(6,95,70,0.06)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200">
          <div className="mb-2 flex items-center gap-1.5 text-emerald-800">
            <CalendarCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="text-[11px] font-semibold">Booking Created</span>
          </div>
          <h4 className="text-sm font-semibold text-stone-950">{paymentLinkData.serviceName}</h4>
          {paymentLinkData.organizationName && (
            <p className="mt-0.5 text-xs text-stone-500">at {paymentLinkData.organizationName}</p>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-emerald-100 pt-2 text-xs">
            <span className="font-medium text-stone-600">{paymentLinkData.formattedTime}</span>
            <span className="font-medium text-emerald-800">${paymentLinkData.totalPrice}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              router.push(paymentLinkData.paymentLink)
              setPaymentLinkData(null)
            }}
            className="mt-2.5 w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Complete Payment →
          </button>
          <button
            type="button"
            onClick={() => setPaymentLinkData(null)}
            className="mt-1.5 w-full text-[10px] text-stone-500 hover:text-stone-700 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Real Discovered Salons / Organizations Cards (When present) */}
      {visibleOrgs.length > 0 && (
        <div className="space-y-2 pt-1 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-amber-600" />
              Discovered Salons
            </span>
            <span className="font-mono text-emerald-700 lowercase">$0 hold guarantee</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {visibleOrgs.map((org) => (
              <div
                key={org.id}
                className="group relative flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] hover:border-amber-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-amber-50 flex items-center justify-center">
                    {org.picture ? (
                      <Image
                        src={org.picture}
                        alt={org.name}
                        fill
                        unoptimized={shouldUnoptimizeImage(org.picture)}
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <Building2 className="h-5 w-5 text-amber-700" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="truncate font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-900 transition-colors">
                        {org.name}
                      </h4>
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="flex items-center text-amber-700 font-medium">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-500 mr-0.5" />
                        {org.rating || 4.9}
                      </span>
                      {org.physicalAddress && (
                        <span className="truncate max-w-[130px] flex items-center">
                          <MapPin className="h-3 w-3 mr-0.5 shrink-0" />
                          {org.physicalAddress}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void onSend(`Show services for ${org.name}`)}
                  className="shrink-0 flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 transition-colors cursor-pointer"
                >
                  <span>Services</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Recommended Services (When present) */}
      {visibleServices.length > 0 && (
        <div className="space-y-2 pt-1 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Recommended Services
            </span>
            <span className="font-mono text-emerald-700 lowercase">$0 today</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {visibleServices.map((rec, idx) => (
              <div
                key={rec.serviceId || idx}
                className="group relative rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/40 via-white to-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] hover:border-amber-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100">
                    <Image
                      src={rec.imageUrl || rec.organizationPicture || SERVICE_IMAGE_FALLBACK}
                      alt={rec.name}
                      fill
                      unoptimized={shouldUnoptimizeImage(
                        rec.imageUrl || rec.organizationPicture || SERVICE_IMAGE_FALLBACK,
                      )}
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-900 transition-colors">
                          {rec.name}
                        </h4>
                        <p className="truncate text-[11px] text-slate-500 font-medium">
                          {rec.organizationName}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block font-mono text-xs sm:text-sm font-bold text-slate-900">
                          ${rec.basePrice}
                        </span>
                        <span className="block text-[9px] font-mono text-emerald-700 font-medium">
                          $0 hold
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-amber-100">
                      <div className="flex items-center gap-2">
                        {rec.durationMinutes && (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                            <Clock className="h-3 w-3 text-amber-600" />
                            {rec.durationMinutes} min
                          </span>
                        )}
                        {rec.distanceKm !== null && rec.distanceKm !== undefined && (
                          <span className="flex items-center gap-0.5 font-mono text-[10px] text-amber-800">
                            <MapPin className="h-3 w-3 text-amber-600" />
                            {rec.distanceKm} km
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          void onSend(`Book ${rec.name} at ${rec.organizationName}`)
                        }}
                        className="flex items-center gap-1 rounded-lg bg-stone-950 hover:bg-amber-600 text-white px-2 py-0.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <CalendarCheck className="h-3 w-3" />
                        <span>Select &amp; Book</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {canShowMoreServices && (
            <button
              type="button"
              disabled={isSending || connectionState !== ConnectionState.Connected}
              onClick={() => void onSend('Show me a few more options')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-amber-300 hover:bg-amber-50/60 cursor-pointer disabled:opacity-40"
            >
              Show a few more
            </button>
          )}
        </div>
      )}
    </>
  )
}
