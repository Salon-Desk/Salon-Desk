'use client'

import {
  Bot,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  MapPin,
  Mic,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import Image from 'next/image'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type {
  AgentConfirmedBooking,
  AgentOrganizationRecommendation,
  AgentServiceRecommendation,
} from '@/components/chat/useAgentChat'
import { SERVICE_IMAGE_FALLBACK } from '@/lib/data/service-content'
import { cn } from '@/lib/utils'

export interface ChatMessageItem {
  id: string
  sender: 'user' | 'assistant'
  text: string
  time: string
  recommendations?: AgentServiceRecommendation[]
  organizations?: AgentOrganizationRecommendation[]
  confirmedBooking?: AgentConfirmedBooking | null
}

export interface ChatPanelShellProps {
  mode: 'chat' | 'voice'
  onModeChange?: (mode: 'chat' | 'voice') => void
  onClose: () => void
  showModeToggle?: boolean
  children: React.ReactNode
}

export function ConciergeAvatar({
  className,
  size = 'md',
  showDot = false,
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showDot?: boolean
}) {
  const sizeClasses = {
    sm: 'h-7 w-7 text-xs rounded-lg',
    md: 'h-8.5 w-8.5 text-sm rounded-xl',
    lg: 'h-10 w-10 text-base rounded-2xl',
  }
  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white shadow-xs',
        sizeClasses[size],
        className,
      )}
      aria-hidden="true"
    >
      <Sparkles className={cn(iconSizes[size], 'text-amber-50')} />
      {showDot && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white" />
        </span>
      )}
    </div>
  )
}

export function ChatPanelShell({
  mode,
  onModeChange,
  onClose,
  showModeToggle = false,
  children,
}: ChatPanelShellProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:flex-row sm:justify-end bg-slate-950/40 backdrop-blur-xs motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
      <button
        type="button"
        aria-label="Close concierge"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
        tabIndex={-1}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="SalonDesk Concierge"
        className="relative z-10 flex h-[92dvh] sm:h-[calc(100dvh-2rem)] w-full max-w-full sm:max-w-[26rem] sm:m-4 flex-col rounded-t-2xl sm:rounded-2xl bg-white text-slate-900 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.9)] border border-slate-200/90 overflow-hidden motion-safe:animate-in motion-safe:slide-in-from-bottom-6 sm:motion-safe:slide-in-from-right-6 motion-safe:duration-250"
      >
        {/* Mobile grab handle */}
        <div className="pt-2.5 pb-1 sm:hidden flex justify-center bg-white">
          <div className="h-1 w-10 rounded-full bg-slate-300" aria-hidden="true" />
        </div>

        {/* Concierge Header */}
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4.5 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <ConciergeAvatar size="md" showDot />
            <div>
              <h2 className="font-bold text-sm tracking-tight text-slate-900">
                SalonDesk Concierge
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
                <span>
                  {mode === 'voice' ? 'Live voice · talk naturally' : 'Online · $0 due today'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showModeToggle && onModeChange && (
              <div
                role="tablist"
                aria-label="Concierge mode"
                className="flex items-center rounded-full bg-slate-100 p-0.5 border border-slate-200/60"
              >
                <button
                  role="tab"
                  type="button"
                  aria-selected={mode === 'chat'}
                  onClick={() => onModeChange('chat')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500',
                    mode === 'chat'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70'
                      : 'text-slate-500 hover:text-slate-900',
                  )}
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>Chat</span>
                </button>
                <button
                  role="tab"
                  type="button"
                  aria-selected={mode === 'voice'}
                  onClick={() => onModeChange('voice')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500',
                    mode === 'voice'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70'
                      : 'text-slate-500 hover:text-slate-900',
                  )}
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>Voice</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close concierge"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 shadow-xs transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}

function renderInlineFormatting(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-stone-950 dark:text-stone-50">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

export function RichText({ content, className }: { content: string; className?: string }) {
  const blocks = content.split(/\n{2,}/)

  return (
    <div className={cn('space-y-2', className)}>
      {blocks.map((block, blockIdx) => {
        const lines = block.split('\n').filter((l) => l.trim().length > 0)
        if (lines.length === 0) return null

        const isBulletList = lines.every((line) => /^[-*]\s+/.test(line.trim()))
        if (isBulletList) {
          return (
            <ul key={blockIdx} className="list-disc pl-4 space-y-1">
              {lines.map((line, lineIdx) => {
                const itemText = line.trim().replace(/^[-*]\s+/, '')
                return <li key={lineIdx}>{renderInlineFormatting(itemText)}</li>
              })}
            </ul>
          )
        }

        const isNumberedList = lines.every((line) => /^\d+\.\s+/.test(line.trim()))
        if (isNumberedList) {
          return (
            <ol key={blockIdx} className="list-decimal pl-4 space-y-1">
              {lines.map((line, lineIdx) => {
                const itemText = line.trim().replace(/^\d+\.\s+/, '')
                return <li key={lineIdx}>{renderInlineFormatting(itemText)}</li>
              })}
            </ol>
          )
        }

        return (
          <p key={blockIdx} className="leading-relaxed">
            {lines.map((line, lineIdx) => (
              <span key={lineIdx}>
                {lineIdx > 0 && <br />}
                {renderInlineFormatting(line)}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

export function ServiceCard({
  service,
  onSelect,
}: {
  service: AgentServiceRecommendation
  onSelect: (service: AgentServiceRecommendation) => void
}) {
  return (
    <div
      onClick={() => onSelect(service)}
      className="group relative rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-3.5 text-stone-900 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-200/80 bg-stone-100">
          <Image
            src={service.imageUrl || service.organizationPicture || SERVICE_IMAGE_FALLBACK}
            alt={service.name}
            fill
            sizes="64px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                {service.name}
              </h4>
              <p className="text-[11px] text-stone-500 font-medium truncate mt-0.5">
                {service.organizationName}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="font-mono tabular-nums tracking-tight font-extrabold text-sm text-amber-950">
                ${service.basePrice}
              </span>
              <span className="block text-[10px] text-emerald-700 font-medium">$0 today</span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-600 pt-2 border-t border-amber-100">
            <div className="flex items-center gap-2">
              {service.durationMinutes ? (
                <span className="flex items-center gap-1 font-mono text-[11px] text-stone-500">
                  <Clock className="h-3 w-3 text-amber-600" />
                  {service.durationMinutes} min
                </span>
              ) : null}
              {service.distanceKm !== null && service.distanceKm !== undefined ? (
                <span className="flex items-center gap-0.5 font-mono text-[11px] text-amber-800">
                  <MapPin className="h-3 w-3 text-amber-600" />
                  {service.distanceKm} km
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onSelect(service)
        }}
        className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg bg-stone-950 hover:bg-amber-600 text-white py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <CalendarCheck className="h-3.5 w-3.5" />
        <span>Select &amp; book</span>
      </button>
    </div>
  )
}

export function OrganizationCard({
  org,
  onShowServices,
}: {
  org: AgentOrganizationRecommendation
  onShowServices: (orgName: string) => void
}) {
  return (
    <div className="group relative flex items-center justify-between gap-3 rounded-xl border border-stone-200/80 bg-white p-3 text-stone-900 shadow-xs hover:border-amber-300 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-stone-200/80 bg-amber-50 flex items-center justify-center">
          {org.picture ? (
            <Image src={org.picture} alt={org.name} fill sizes="44px" className="object-cover" />
          ) : (
            <Building2 className="h-5 w-5 text-amber-700" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate font-bold text-xs sm:text-sm text-stone-900 group-hover:text-amber-900 transition-colors">
              {org.name}
            </h4>
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-stone-500">
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
              <span className="font-mono text-amber-800">· {org.distanceKm} km</span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onShowServices(org.name)}
        className="shrink-0 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/70 px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        Services
      </button>
    </div>
  )
}

export function ConfirmedBookingCard({ booking }: { booking: AgentConfirmedBooking }) {
  return (
    <div className="mt-2.5 w-full rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-4 text-stone-900 shadow-xs motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200">
      <div className="flex items-center gap-2 mb-2 text-emerald-800">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
        <span className="font-bold text-xs uppercase tracking-wider">Appointment confirmed</span>
      </div>
      <h4 className="font-serif text-base font-bold text-stone-950">{booking.serviceName}</h4>
      {booking.organizationName && (
        <p className="text-xs text-stone-600 mt-0.5">at {booking.organizationName}</p>
      )}
      <div className="mt-2.5 flex items-center justify-between border-t border-emerald-200/60 pt-2 text-xs">
        <span className="text-stone-600 font-medium">
          {booking.formattedTime || booking.startsAt}
        </span>
        <span className="font-mono font-bold text-emerald-800">
          $0 hold today · ${booking.totalPrice}
        </span>
      </div>
    </div>
  )
}

const DEFAULT_WELCOME_SUGGESTIONS = [
  {
    label: 'Find salons near me',
    hint: 'Explore top-rated verified stylists',
    prompt: 'Find salons near me',
  },
  {
    label: 'Book haircut tomorrow',
    hint: 'Check openings and reserve at 2 PM',
    prompt: 'Book haircut tomorrow at 2pm',
  },
  {
    label: 'How $0 hold works',
    hint: 'Learn about PayPal zero-debit holds',
    prompt: 'How does the $0 hold work?',
  },
  {
    label: 'Show available services',
    hint: 'Browse popular salon treatments',
    prompt: 'Show available services',
  },
]

const DEFAULT_CHIPS = [
  'Find salons near me',
  'Book haircut tomorrow at 2pm',
  'Show available services',
  'How does the $0 hold work?',
]

export interface ChatConversationProps<T extends ChatMessageItem = ChatMessageItem> {
  messages: T[]
  isThinking: boolean
  prompt: string
  onPromptChange: (value: string) => void
  onSend: (prompt?: string) => void
  onSelectService?: (service: AgentServiceRecommendation) => void
  onTryVoice?: () => void
  renderExtras?: (message: T) => React.ReactNode
  suggestions?: string[]
  className?: string
}

export function ChatConversation<T extends ChatMessageItem = ChatMessageItem>({
  messages,
  isThinking,
  prompt,
  onPromptChange,
  onSend,
  onSelectService,
  onTryVoice,
  renderExtras,
  suggestions,
  className,
}: ChatConversationProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isScrolledUp, setIsScrolledUp] = useState(false)
  const isMountedRef = useRef(false)
  const justSentRef = useRef(false)

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return true
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    return distance < 96
  }, [])

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollContainerRef.current
    if (!el) return
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else {
      el.scrollTop = el.scrollHeight
    }
    setIsScrolledUp(false)
  }, [])

  // Jump to bottom without animation on mount
  useEffect(() => {
    scrollToBottom(false)
    isMountedRef.current = true
    textareaRef.current?.focus()
  }, [scrollToBottom])

  // Auto-scroll when near bottom or just sent
  useEffect(() => {
    if (!isMountedRef.current) return
    const el = scrollContainerRef.current
    if (!el) return

    const wasJustSent = justSentRef.current
    justSentRef.current = false

    if (wasJustSent || isNearBottom()) {
      scrollToBottom(true)
    }
  }, [messages.length, isThinking, isNearBottom, scrollToBottom])

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setIsScrolledUp(distanceFromBottom >= 96)
  }

  // Auto-growing textarea (max 120px)
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, 120)
    el.style.height = `${newHeight}px`
  }, [prompt])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (prompt.trim() && !isThinking) {
        justSentRef.current = true
        onSend()
      }
    }
  }

  const handleSelectService = (service: AgentServiceRecommendation) => {
    if (onSelectService) {
      onSelectService(service)
    } else {
      justSentRef.current = true
      onSend(`Book ${service.name} at ${service.organizationName}`)
    }
  }

  const isOnlyWelcome = messages.length === 1 && messages[0].sender === 'assistant'
  const activeChips = suggestions && suggestions.length > 0 ? suggestions : DEFAULT_CHIPS

  return (
    <div
      className={cn(
        'relative flex flex-1 flex-col justify-between overflow-hidden bg-[#FAFAF9]',
        className,
      )}
    >
      {/* Scrollable conversation log */}
      <div
        ref={scrollContainerRef}
        role="log"
        aria-live="polite"
        onScroll={handleScroll}
        className="flex-1 space-y-3.5 overflow-y-auto p-4 sm:p-5"
      >
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user'
          const isFirstInGroup = idx === 0 || messages[idx - 1].sender !== msg.sender
          const isLastInGroup =
            idx === messages.length - 1 || messages[idx + 1].sender !== msg.sender
          const effectiveOrgs = !isUser && msg.organizations ? msg.organizations : []
          const effectiveRecs = !isUser && msg.recommendations ? msg.recommendations : []

          return (
            <div key={msg.id} className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'flex items-start gap-2 max-w-[88%]',
                  isUser ? 'justify-end' : 'justify-start',
                )}
              >
                {!isUser && (
                  <div className="w-7 shrink-0 flex justify-center">
                    {isFirstInGroup ? (
                      <ConciergeAvatar size="sm" className="mt-0.5" />
                    ) : (
                      <div className="w-7" aria-hidden="true" />
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs',
                    isUser
                      ? cn(
                          'bg-stone-900 text-stone-50 font-normal',
                          isFirstInGroup && 'rounded-tr-xs',
                        )
                      : cn(
                          'border border-stone-200/90 bg-white text-stone-900 font-normal',
                          isFirstInGroup && 'rounded-tl-xs',
                        ),
                  )}
                >
                  <RichText content={msg.text} />
                </div>
              </div>

              {/* Timestamp on last message of a group */}
              {isLastInGroup && (
                <span
                  className={cn(
                    'text-[10px] text-stone-400 font-mono mt-1 px-1',
                    isUser ? 'self-end' : 'self-start ml-9',
                  )}
                >
                  {msg.time}
                </span>
              )}

              {/* Confirmed Booking Card */}
              {!isUser && msg.confirmedBooking && (
                <div className="ml-9 w-[calc(100%-2.25rem)] max-w-[94%]">
                  <ConfirmedBookingCard booking={msg.confirmedBooking} />
                </div>
              )}

              {/* Recommended Salons */}
              {!isUser && effectiveOrgs.length > 0 && (
                <div className="ml-9 mt-2.5 w-[calc(100%-2.25rem)] max-w-[94%] space-y-2 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wider px-1">
                    <Building2 className="h-3.5 w-3.5 text-amber-600" />
                    <span>Recommended salons</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {effectiveOrgs.map((org) => (
                      <OrganizationCard
                        key={org.id}
                        org={org}
                        onShowServices={(name) => {
                          justSentRef.current = true
                          onSend(`Show services for ${name}`)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Services */}
              {!isUser && effectiveRecs.length > 0 && (
                <div className="ml-9 mt-2.5 w-[calc(100%-2.25rem)] max-w-[94%] space-y-2 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      Verified services
                    </span>
                    <span className="text-emerald-700 font-mono lowercase">$0 hold today</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {effectiveRecs.map((rec) => (
                      <ServiceCard
                        key={rec.serviceId}
                        service={rec}
                        onSelect={handleSelectService}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Custom extras, e.g. ProposalCard */}
              {!isUser && renderExtras && (
                <div className="ml-9 w-[calc(100%-2.25rem)] max-w-[94%]">{renderExtras(msg)}</div>
              )}
            </div>
          )
        })}

        {/* 2x2 grid of suggestions when only the welcome message exists */}
        {isOnlyWelcome && (
          <div className="ml-9 mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 w-[calc(100%-2.25rem)]">
            {DEFAULT_WELCOME_SUGGESTIONS.map((card, i) => (
              <button
                key={i}
                type="button"
                disabled={isThinking}
                onClick={() => {
                  justSentRef.current = true
                  onSend(card.prompt)
                }}
                className="flex flex-col items-start rounded-xl border border-stone-200/90 bg-white p-3 text-left shadow-xs hover:border-amber-300 hover:bg-amber-50/50 hover:shadow-sm transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40"
              >
                <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {card.label}
                </span>
                {card.hint && (
                  <span className="text-[11px] text-stone-500 mt-0.5">{card.hint}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Animated three-dot typing indicator */}
        {isThinking && (
          <div className="flex items-start gap-2 max-w-[85%] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
            <ConciergeAvatar size="sm" className="mt-0.5" />
            <div className="rounded-2xl rounded-tl-xs border border-stone-200/90 bg-white px-4 py-3 shadow-xs">
              <span className="sr-only">AI Concierge is typing…</span>
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-amber-500 motion-safe:animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-amber-500 motion-safe:animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-amber-500 motion-safe:animate-bounce" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scrolled-up "Latest" jump button */}
      {isScrolledUp && (
        <div className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-20 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="flex items-center gap-1 rounded-full bg-stone-900/95 text-white text-xs font-medium px-3.5 py-1.5 shadow-md shadow-black/20 hover:bg-stone-800 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <span>Latest</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Compact suggestion chips (shown after welcome stage) */}
      {!isOnlyWelcome && activeChips.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-stone-200/70 bg-white/80 px-4 py-2 scrollbar-none">
          {activeChips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isThinking}
              onClick={() => {
                justSentRef.current = true
                onSend(chip)
              }}
              className="shrink-0 rounded-full border border-stone-200/80 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 shadow-xs hover:border-amber-300 hover:bg-amber-50/60 hover:text-amber-950 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Composer container */}
      <div className="border-t border-stone-200/80 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (prompt.trim() && !isThinking) {
              justSentRef.current = true
              onSend()
            }
          }}
          className="flex items-end gap-2 rounded-2xl border border-stone-200/90 bg-white p-1.5 pl-3.5 shadow-xs focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask or book anything…"
            className="flex-1 resize-none max-h-[120px] bg-transparent py-1.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden leading-relaxed"
          />

          {!prompt.trim() && onTryVoice && (
            <button
              type="button"
              onClick={onTryVoice}
              aria-label="Use voice concierge"
              title="Use voice concierge"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-500 hover:text-amber-700 hover:bg-amber-100/60 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Mic className="h-4 w-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={!prompt.trim() || isThinking}
            aria-label="Send message"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-950 text-white hover:bg-amber-600 disabled:opacity-30 disabled:hover:bg-stone-950 shadow-xs transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>

        <p className="mt-1.5 text-center text-[10px] text-stone-400">
          AI can make mistakes — confirm details before booking.
        </p>
      </div>
    </div>
  )
}
