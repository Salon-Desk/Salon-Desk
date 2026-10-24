'use client'

import { ConnectionState } from 'livekit-client'
import {
  Building2,
  CalendarCheck,
  Clock,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  User,
} from 'lucide-react'
import Image from 'next/image'
import React, { useState } from 'react'

import { LegalDialog, type LegalDoc } from '@/app/client/_components/LegalDialog'
import type {
  AgentOrganizationRecommendation,
  AgentServiceRecommendation,
  AgentStylistRecommendation,
} from '@/components/chat/useAgentChat'
import { Checkbox } from '@/components/ui/checkbox'
import { SERVICE_IMAGE_FALLBACK } from '@/lib/data/service-content'
import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'

export interface PaymentLinkData {
  bookingId: string
  serviceName: string
  organizationName: string
  stylistName?: string
  formattedTime: string
  servicePrice?: string | number
  platformFee?: string | number
  holdAmount?: string | number
  totalPrice: string
  freeCancelDeadline?: string
  freeCancelLabel?: string
  lateCancelFee?: string | number
  noShowFee?: string | number
  paymentLink: string
}

function VoicePaymentCard({ data, onDismiss }: { data: PaymentLinkData; onDismiss: () => void }) {
  const [agreed, setAgreed] = useState(false)
  const [openDoc, setOpenDoc] = useState<LegalDoc | null>(null)

  const sPrice = Number(data.servicePrice ?? data.totalPrice)
  const pFee = Number(data.platformFee ?? 0)
  const hAmount = Number(data.holdAmount ?? sPrice + pFee)
  const freeCancelLabel = data.freeCancelLabel || '24h before appointment'

  return (
    <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-amber-50/20 p-3.5 text-stone-900 shadow-[0_2px_8px_-2px_rgba(6,95,70,0.08)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200 space-y-3">
      <div>
        <div className="mb-1 flex items-center gap-1.5 text-emerald-800">
          <CalendarCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Appointment Reserved
          </span>
        </div>
        <h4 className="text-sm font-bold text-stone-950">{data.serviceName}</h4>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-stone-600">
          {data.organizationName && <span>at {data.organizationName}</span>}
          {data.stylistName && (
            <span className="font-medium text-stone-800">· with {data.stylistName}</span>
          )}
        </div>
        <p className="mt-1 text-xs font-semibold text-stone-900">📅 {data.formattedTime}</p>
      </div>

      {/* Payment & Price Breakdown */}
      <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-2.5 text-xs space-y-1.5">
        <div className="flex items-center justify-between text-stone-600">
          <span>Service price</span>
          <span className="font-medium text-stone-900">{formatUsd(sPrice)}</span>
        </div>
        {pFee > 0 && (
          <div className="flex items-center justify-between text-stone-600">
            <span>Platform fee</span>
            <span className="font-medium text-stone-900">{formatUsd(pFee)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-stone-200/80 pt-1.5 font-bold text-stone-950">
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-amber-700" />
            <span>PayPal hold (service + platform fee)</span>
          </span>
          <span className="text-stone-900">{formatUsd(hAmount)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md">
          <span>Due today</span>
          <span>$0.00 (PayPal hold)</span>
        </div>
      </div>

      {/* Cancellation Policy Snapshot */}
      <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-2.5 text-[11px] space-y-1 text-stone-700">
        <div className="flex items-center gap-1 font-bold text-amber-900 uppercase tracking-wider text-[10px]">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
          <span>Cancellation policy</span>
        </div>
        <p className="text-stone-600">
          Free cancellation until{' '}
          <span className="font-semibold text-stone-900">{freeCancelLabel}</span>.
        </p>
        <p className="text-stone-500 text-[10.5px]">
          Late cancel:{' '}
          <span className="font-medium text-stone-800">
            {data.lateCancelFee != null ? formatUsd(Number(data.lateCancelFee)) : '50%'}
          </span>{' '}
          · No-show:{' '}
          <span className="font-medium text-stone-800">
            {data.noShowFee != null ? formatUsd(Number(data.noShowFee)) : '50%'}
          </span>
        </p>
      </div>

      {/* Agreement Checkbox */}
      <div className="space-y-2 pt-0.5">
        <div
          onClick={(e) => {
            const target = e.target as HTMLElement
            if (target.closest('button, a')) return
            setAgreed(!agreed)
          }}
          className={cn(
            'flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 transition-colors select-none text-[11px] leading-relaxed',
            agreed
              ? 'border-emerald-300 bg-emerald-50/50 text-stone-800'
              : 'border-stone-200 bg-white hover:border-stone-300 text-stone-600',
          )}
        >
          <Checkbox
            checked={agreed}
            onCheckedChange={(val) => setAgreed(val === true)}
            className="mt-0.5 size-4 cursor-pointer rounded border-stone-300 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white"
          />
          <div>
            I agree to the cancellation policy and authorize a $0 PayPal hold of{' '}
            <span className="font-semibold text-stone-900">{formatUsd(hAmount)}</span>{' '}
            {pFee > 0 && (
              <span className="text-stone-500 font-normal">
                ({formatUsd(sPrice)} service fee + {formatUsd(pFee)} platform fee)
              </span>
            )}
            . If I cancel after {freeCancelLabel} or miss the appointment, the matching fee may be
            captured from the hold. I accept the{' '}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenDoc('terms')
              }}
              className="font-semibold text-amber-800 underline decoration-amber-300 underline-offset-2 hover:text-amber-900"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpenDoc('privacy')
              }}
              className="font-semibold text-amber-800 underline decoration-amber-300 underline-offset-2 hover:text-amber-900"
            >
              Privacy Policy
            </button>
            .
          </div>
        </div>

        {/* Payment Button */}
        {agreed ? (
          <a
            href={data.paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDismiss}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC439] hover:bg-[#F4B41A] py-2.5 px-3 text-xs font-bold text-[#003087] shadow-xs transition-all active:scale-[0.99] cursor-pointer"
          >
            <Lock className="h-3.5 w-3.5 shrink-0 text-[#003087]" />
            <span>Continue to PayPal ($0 Hold) →</span>
          </a>
        ) : (
          <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-100 py-2.5 px-3 text-xs font-semibold text-stone-400 cursor-not-allowed select-none">
            <Lock className="h-3.5 w-3.5 shrink-0 text-stone-400" />
            <span>Accept agreement above to continue</span>
          </div>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="mt-1 w-full text-center text-[10px] text-stone-500 hover:text-stone-700 cursor-pointer"
        >
          Dismiss
        </button>
      </div>

      {openDoc && <LegalDialog doc={openDoc} onClose={() => setOpenDoc(null)} />}
    </div>
  )
}

export interface VoiceDiscoveredContentProps {
  paymentLinkData: PaymentLinkData | null
  setPaymentLinkData: (data: PaymentLinkData | null) => void
  visibleOrgs: AgentOrganizationRecommendation[]
  visibleServices: AgentServiceRecommendation[]
  visibleStylists?: AgentStylistRecommendation[]
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
  visibleStylists,
  canShowMoreServices,
  isSending,
  connectionState,
  onSend,
}: VoiceDiscoveredContentProps) {
  return (
    <>
      {/* Payment Link Card (When present) */}
      {paymentLinkData && (
        <VoicePaymentCard data={paymentLinkData} onDismiss={() => setPaymentLinkData(null)} />
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
                        unoptimized={shouldUnoptimizedImage(org.picture)}
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
                      unoptimized={shouldUnoptimizedImage(
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

      {/* Real Discovered Stylists (When present) */}
      {visibleStylists && visibleStylists.length > 0 && (
        <div className="space-y-2 pt-1 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-amber-600" />
              Available Stylists
            </span>
            <span className="font-mono text-emerald-700 lowercase">select a stylist</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {visibleStylists.map((st) => (
              <div
                key={st.id}
                className="group relative flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] hover:border-amber-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200/80 bg-amber-50 flex items-center justify-center">
                    {st.isAny ? (
                      <Sparkles className="h-5 w-5 text-amber-700" />
                    ) : st.picture ? (
                      <Image
                        src={st.picture}
                        alt={st.name}
                        fill
                        unoptimized={shouldUnoptimizeImage(st.picture)}
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-stone-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="truncate font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-900 transition-colors">
                        {st.name}
                      </h4>
                      {st.isAny ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          Fastest
                        </span>
                      ) : st.rating ? (
                        <span className="inline-flex items-center text-[11px] font-medium text-amber-800">
                          <Star className="mr-0.5 h-3 w-3 fill-amber-400 text-amber-500" />
                          {st.rating}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{st.role || 'Stylist'}</span>
                      {st.organizationName && <span>· {st.organizationName}</span>}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void onSend(st.isAny ? 'Any available stylist' : `Book with ${st.name}`)
                  }
                  className="shrink-0 flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 transition-colors cursor-pointer"
                >
                  <span>Select</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
