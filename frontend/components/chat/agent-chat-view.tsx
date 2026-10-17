'use client'

import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Mic,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef } from 'react'

import type {
  AgentChatMessage,
  AgentOrganizationRecommendation,
  AgentServiceRecommendation,
} from '@/components/chat/use-agent-chat'
import { SERVICE_IMAGE_FALLBACK } from '@/lib/data/service-content'
import { cn } from '@/lib/utils'

interface AgentChatViewProps {
  messages: AgentChatMessage[]
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  isThinking: boolean
  prompt: string
  onPromptChange: (value: string) => void
  onSend: (prompt?: string) => void
  onSelectService?: (service: AgentServiceRecommendation) => void
  onTryVoice?: () => void
  className?: string
}

export function AgentChatView({
  messages,
  messagesEndRef,
  isThinking,
  prompt,
  onPromptChange,
  onSend,
  onSelectService,
  onTryVoice,
  className,
}: AgentChatViewProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const count = messages.length

  useEffect(() => {
    if (count < 1) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [count, messagesEndRef])

  const handleSelectService = (rec: AgentServiceRecommendation) => {
    if (onSelectService) {
      onSelectService(rec)
    } else {
      onSend(`Book ${rec.name} at ${rec.organizationName}`)
    }
  }

  return (
    <div
      className={cn('flex flex-1 flex-col justify-between overflow-hidden bg-[#FAFAFA]', className)}
    >
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user'
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'rounded-tr-xs bg-slate-900 text-white shadow-xs font-normal'
                    : 'rounded-tl-xs border border-slate-200/80 bg-white text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] font-normal'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>

              {/* Confirmed Booking Celebratory Card */}
              {!isUser && msg.confirmedBooking && (
                <div className="mt-2.5 w-full max-w-[94%] rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-4 text-slate-900 shadow-[0_4px_12px_rgba(16,185,129,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 mb-2 text-emerald-800">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-xs uppercase tracking-wider">
                      Appointment Confirmed
                    </span>
                  </div>
                  <h4 className="font-serif text-base font-bold text-slate-950">
                    {msg.confirmedBooking.serviceName}
                  </h4>
                  {msg.confirmedBooking.organizationName && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      at {msg.confirmedBooking.organizationName}
                    </p>
                  )}
                  <div className="mt-2.5 flex items-center justify-between border-t border-emerald-200/60 pt-2 text-xs">
                    <span className="text-slate-600 font-medium">
                      {msg.confirmedBooking.formattedTime || msg.confirmedBooking.startsAt}
                    </span>
                    <span className="font-mono font-bold text-emerald-800">
                      $0 hold today · ${msg.confirmedBooking.totalPrice}
                    </span>
                  </div>
                </div>
              )}

              {/* Organization Cards */}
              {!isUser && msg.organizations && msg.organizations.length > 0 && (
                <div className="mt-2.5 w-full max-w-[94%] space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
                    <Building2 className="h-3.5 w-3.5 text-amber-600" />
                    <span>Recommended Salons</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {msg.organizations.map((org: AgentOrganizationRecommendation) => (
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
                                <span className="truncate max-w-[140px] flex items-center">
                                  <MapPin className="h-3 w-3 mr-0.5 shrink-0" />
                                  {org.physicalAddress}
                                </span>
                              )}
                              {org.distanceKm !== null && org.distanceKm !== undefined && (
                                <span className="font-mono text-amber-800">
                                  · {org.distanceKm} km
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSend(`Show services for ${org.name}`)}
                          className="shrink-0 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/70 px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          View Services
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Cards */}
              {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-2.5 w-full max-w-[94%] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      Verified Services
                    </span>
                    <span className="text-emerald-700 font-mono lowercase">$0 hold today</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {msg.recommendations.map((rec: AgentServiceRecommendation) => (
                      <div
                        key={rec.serviceId}
                        onClick={() => handleSelectService(rec)}
                        className="group relative rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-3.5 text-slate-900 shadow-[0_2px_6px_rgba(245,158,11,0.06),inset_0_1px_0_0_rgba(255,255,255,0.9)] hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          {/* Image Thumbnail */}
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100">
                            <Image
                              src={
                                rec.imageUrl || rec.organizationPicture || SERVICE_IMAGE_FALLBACK
                              }
                              alt={rec.name}
                              fill
                              sizes="64px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Info Column */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                                  {rec.name}
                                </h4>
                                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                  {rec.organizationName}
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono tabular-nums tracking-tight font-extrabold text-sm text-amber-950">
                                  ${rec.basePrice}
                                </span>
                                <span className="block text-[10px] text-emerald-700 font-medium">
                                  $0 today
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-amber-100">
                              <div className="flex items-center gap-2">
                                {rec.durationMinutes ? (
                                  <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                                    <Clock className="h-3 w-3 text-amber-600" />
                                    {rec.durationMinutes} min
                                  </span>
                                ) : null}
                                {rec.distanceKm !== null && rec.distanceKm !== undefined ? (
                                  <span className="flex items-center gap-0.5 font-mono text-[11px] text-amber-800">
                                    <MapPin className="h-3 w-3 text-amber-600" />
                                    {rec.distanceKm} km
                                  </span>
                                ) : null}
                              </div>

                              {/* Interactive Action Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectService(rec)
                                }}
                                className="flex items-center gap-1 rounded-lg bg-stone-950 hover:bg-amber-600 text-white px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                              >
                                <CalendarCheck className="h-3.5 w-3.5" />
                                <span>Select &amp; Book</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {isThinking && (
          <div className="flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)]">
            <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-500" />
            <span className="font-mono text-[11px]">Querying catalog &amp; availability…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {onTryVoice && (
        <div className="border-t border-slate-200/70 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/40 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Mic className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-800">Prefer speaking?</span>
          </div>
          <button
            type="button"
            onClick={onTryVoice}
            className="rounded-lg bg-stone-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 shadow-xs transition-all cursor-pointer"
          >
            Switch to Voice Agent
          </button>
        </div>
      )}

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-200/70 bg-white/80 px-4 py-2 scrollbar-none">
        {[
          'Find a fade near me',
          'Book haircut tomorrow at 2pm',
          'Show salons nearby',
          'How does the $0 hold work?',
        ].map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onSend(chip)}
            className="shrink-0 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:border-amber-300 hover:bg-amber-50/60 hover:text-amber-950 transition-all cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Field Container */}
      <div className="border-t border-slate-200/80 bg-white/95 p-3 sm:p-4 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void onSend()
          }}
          className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-1 pl-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all"
        >
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Ask, search salons, or book anything…"
            className="flex-1 bg-transparent py-1 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isThinking}
            aria-label="Send message"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-950 text-white hover:bg-amber-600 disabled:opacity-30 shadow-xs transition-colors cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
