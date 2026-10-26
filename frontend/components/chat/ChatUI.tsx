'use client'

import { ArrowUpRight, ChevronDown, Mic, Send, Sparkles, X } from 'lucide-react'
import Image from 'next/image'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type {
  AgentChatReplyContext,
  AgentConfirmedBooking,
  AgentOrganizationRecommendation,
  AgentServiceRecommendation,
  AgentStylistRecommendation,
} from '@/components/chat/useAgentChat'
import { highlightElement } from '@/hooks/useAgentUiActions'
import { type AssistantPortal, isSupportPortal, portalChrome } from '@/lib/assistant-portal'
import { cn } from '@/lib/utils'

export const CONCIERGE_RECOMMENDATION_LIMIT = 3
export const SHOW_MORE_PROMPT = 'Show me a few more options'

export interface ChatMessageItem {
  id: string
  sender: 'user' | 'assistant'
  text: string
  time: string
  recommendations?: AgentServiceRecommendation[]
  organizations?: AgentOrganizationRecommendation[]
  stylists?: AgentStylistRecommendation[]
  confirmedBooking?: AgentConfirmedBooking | null
  replyContext?: AgentChatReplyContext | null
  navigation?: {
    target: string
    tab?: string | null
    label: string
    reason?: string | null
  } | null
  uiAction?: {
    action: string
    target?: string | null
    label?: string | null
    details?: string | null
    selector?: string | null
  } | null
}

export {
  AuthPromptCard,
  ConfirmedBookingCard,
  OrganizationCard,
  ServiceCard,
  StylistCard,
} from './ChatCards'
export { ChatPanelShell, type ChatPanelShellProps, ConciergeAvatar } from './ChatPanelShell'
export { RichText } from './RichText'

import {
  AuthPromptCard,
  ConfirmedBookingCard,
  OrganizationCard,
  ServiceCard,
  StylistCard,
} from './ChatCards'
import { ConciergeAvatar } from './ChatPanelShell'
import { RichText } from './RichText'

function conversationChips(messages: ChatMessageItem[], portal: AssistantPortal): string[] {
  const chrome = portalChrome(portal)
  const lastAssistant = [...messages].reverse().find((msg) => msg.sender === 'assistant')
  if (!lastAssistant) return chrome.chips
  if (isSupportPortal(portal)) return chrome.chips
  if (lastAssistant.confirmedBooking) {
    return ['What should I bring?', 'Can I change the time?']
  }
  if (lastAssistant.recommendations && lastAssistant.recommendations.length > 0) {
    const chips = ['Something closer', 'A different salon']
    if (lastAssistant.recommendations.length === CONCIERGE_RECOMMENDATION_LIMIT) {
      chips.unshift(SHOW_MORE_PROMPT)
    }
    return chips
  }
  if (lastAssistant.organizations && lastAssistant.organizations.length > 0) {
    return ['Show their services', 'Something closer']
  }
  return chrome.chips
}

export interface ChatConversationProps<T extends ChatMessageItem = ChatMessageItem> {
  messages: T[]
  isThinking: boolean
  prompt: string
  onPromptChange: (value: string) => void
  onSend: (prompt?: string) => void
  replyContext?: AgentChatReplyContext | null
  onClearReplyContext?: () => void
  onSelectService?: (service: AgentServiceRecommendation) => void
  onSelectStylist?: (stylist: AgentStylistRecommendation) => void
  onTryVoice?: () => void
  renderExtras?: (message: T) => React.ReactNode
  suggestions?: string[]
  portal?: AssistantPortal
  className?: string
}

/**
 * Main chat conversation view with message list, action chips, auto-resizing input, and quick actions.
 */
export function ChatConversation<T extends ChatMessageItem = ChatMessageItem>({
  messages,
  isThinking,
  prompt,
  onPromptChange,
  onSend,
  replyContext,
  onClearReplyContext,
  onSelectService,
  onSelectStylist,
  onTryVoice,
  renderExtras,
  suggestions,
  portal = 'client',
  className,
}: ChatConversationProps<T>) {
  const chrome = portalChrome(portal)
  const support = isSupportPortal(portal)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const latestMessageRef = useRef<HTMLDivElement>(null)
  const [isScrolledUp, setIsScrolledUp] = useState(false)
  const isMountedRef = useRef(false)
  const justSentRef = useRef(false)
  const prevMessagesLengthRef = useRef(messages.length)
  const [hiddenServicesMsgIds, setHiddenServicesMsgIds] = useState<Record<string, boolean>>({})
  const [dismissedStylistMsgIds, setDismissedStylistMsgIds] = useState<Record<string, boolean>>({})
  const [dismissedServiceMsgIds, setDismissedServiceMsgIds] = useState<Record<string, boolean>>({})
  const [dismissedOrgMsgIds, setDismissedOrgMsgIds] = useState<Record<string, boolean>>({})

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 96
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

  useEffect(() => {
    scrollToBottom(false)
    isMountedRef.current = true
    textareaRef.current?.focus()
  }, [scrollToBottom])

  useEffect(() => {
    if (replyContext) {
      textareaRef.current?.focus()
    }
  }, [replyContext])

  useEffect(() => {
    if (!isMountedRef.current) return
    const el = scrollContainerRef.current
    if (!el) return

    const hasNewMessage = messages.length > prevMessagesLengthRef.current
    prevMessagesLengthRef.current = messages.length

    const wasJustSent = justSentRef.current
    justSentRef.current = false

    if (wasJustSent) {
      scrollToBottom(true)
      return
    }

    if (isThinking) {
      if (isNearBottom()) {
        scrollToBottom(true)
      }
      return
    }

    if (hasNewMessage && isNearBottom()) {
      const lastMsg = messages[messages.length - 1]
      const msgEl = latestMessageRef.current

      if (lastMsg?.sender === 'assistant' && msgEl) {
        // If the reply is tall (contains cards or long explanations),
        // ensure the TOP of the reply is comfortably visible rather than
        // slamming all the way down past the text.
        const isTallMessage = msgEl.offsetHeight + 80 > el.clientHeight
        if (isTallMessage) {
          const targetTop = Math.max(0, msgEl.offsetTop - 16)
          el.scrollTo({ top: targetTop, behavior: 'smooth' })
          setIsScrolledUp(false)
          return
        }
      }

      scrollToBottom(true)
    }
  }, [messages.length, isThinking, isNearBottom, scrollToBottom, messages])

  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    setIsScrolledUp(el.scrollHeight - el.scrollTop - el.clientHeight >= 96)
  }

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
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

  const handleSelectService = (service: AgentServiceRecommendation, msgId?: string) => {
    if (msgId) {
      setDismissedServiceMsgIds((prev) => ({ ...prev, [msgId]: true }))
    }
    if (onSelectService) {
      onSelectService(service)
    } else {
      justSentRef.current = true
      onSend(`Book ${service.name} at ${service.organizationName}`)
    }
  }

  const handleSelectStylist = (stylist: AgentStylistRecommendation, msgId?: string) => {
    if (msgId) {
      setDismissedStylistMsgIds((prev) => ({ ...prev, [msgId]: true }))
    }
    if (onSelectStylist) {
      onSelectStylist(stylist)
    } else {
      justSentRef.current = true
      onSend(stylist.isAny ? 'Any available stylist' : `Book with ${stylist.name}`)
    }
  }

  const handleSelectOrg = (orgName: string, msgId?: string) => {
    if (msgId) {
      setDismissedOrgMsgIds((prev) => ({ ...prev, [msgId]: true }))
    }
    justSentRef.current = true
    onSend(`Show services for ${orgName}`)
  }

  const sendPrompt = (value: string) => {
    justSentRef.current = true
    onSend(value)
  }

  const isOnlyWelcome = messages.length === 1 && messages[0].sender === 'assistant'
  const activeChips =
    suggestions && suggestions.length > 0 ? suggestions : conversationChips(messages, portal)
  const canSend = Boolean(prompt.trim()) && !isThinking

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col overflow-hidden',
        chrome.panelBg,
        className,
      )}
    >
      {/* Scrollable message timeline */}
      <div
        ref={scrollContainerRef}
        role="log"
        aria-live="polite"
        onScroll={handleScroll}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5"
      >
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user'
          const isFirstInGroup = idx === 0 || messages[idx - 1].sender !== msg.sender
          const isLastMessage = idx === messages.length - 1
          const effectiveRecs = !isUser && msg.recommendations ? msg.recommendations : []
          const effectiveOrgs =
            !isUser && effectiveRecs.length === 0 && msg.organizations ? msg.organizations : []
          const isLatestAssistant = !isUser && isLastMessage && !isThinking
          const isServicesHidden =
            hiddenServicesMsgIds[msg.id] ?? Boolean(msg.stylists && msg.stylists.length > 0)
          const hasReplied = messages.slice(idx + 1).some((m) => m.sender === 'user')

          return (
            <div
              key={msg.id}
              ref={isLastMessage ? latestMessageRef : null}
              className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}
            >
              <div
                className={cn(
                  'flex max-w-[88%] items-end gap-2',
                  isUser ? 'justify-end' : 'justify-start',
                )}
              >
                {!isUser && (
                  <div className="flex w-7 shrink-0 justify-center">
                    {isFirstInGroup ? (
                      <ConciergeAvatar size="sm" portal={portal} />
                    ) : (
                      <div className="w-7" />
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    'rounded-[1.15rem] px-3.5 py-2.5 text-[13px] leading-relaxed',
                    isUser
                      ? cn(
                          'bg-stone-950 text-stone-50 shadow-xs',
                          isFirstInGroup && 'rounded-br-md',
                        )
                      : cn(
                          'border border-stone-200/70 bg-white text-stone-800 shadow-2xs',
                          isFirstInGroup && 'rounded-bl-md',
                        ),
                  )}
                >
                  {isUser && msg.replyContext && (
                    <div className="mb-2 flex items-center gap-2.5 rounded-xl border-l-2 border-l-amber-400 bg-stone-900/90 p-2 text-left backdrop-blur-xs">
                      {msg.replyContext.imageUrl ? (
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-stone-800 border border-stone-700/60">
                          <Image
                            src={msg.replyContext.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                          <Sparkles className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                            Service
                          </span>
                          {msg.replyContext.organizationName && (
                            <span className="text-[10px] text-stone-400 truncate">
                              • {msg.replyContext.organizationName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-stone-100 truncate">
                          {msg.replyContext.serviceName}
                        </p>
                        {(msg.replyContext.basePrice !== undefined ||
                          msg.replyContext.durationMinutes !== undefined) && (
                          <p className="text-[10px] text-stone-400">
                            {msg.replyContext.basePrice !== undefined &&
                              `$${msg.replyContext.basePrice}`}
                            {msg.replyContext.durationMinutes !== undefined &&
                              ` • ${msg.replyContext.durationMinutes}m`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <RichText content={msg.text} />
                </div>
              </div>

              {isLastMessage && (
                <span
                  className={cn(
                    'mt-1 px-1 text-[10px] text-stone-400',
                    isUser ? 'self-end' : 'ml-9 self-start',
                  )}
                >
                  {msg.time}
                </span>
              )}

              {/* Navigation or UI Actions */}
              {!isUser &&
                (msg.navigation ||
                  (msg.uiAction &&
                    !['open_auth_modal', 'open_sign_in', 'open_sign_up'].includes(
                      msg.uiAction.action,
                    ))) && (
                  <div className="ml-9 mt-2 w-[calc(100%-2.25rem)] max-w-[94%]">
                    <div className="flex flex-col gap-1.5 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent p-2.5 text-xs text-stone-800 shadow-2xs backdrop-blur-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold text-amber-950">
                          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                          <span>
                            {msg.uiAction?.label || msg.navigation?.label || 'Action Executed'}
                          </span>
                        </span>
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          Executed
                        </span>
                      </div>
                      {msg.uiAction?.details && (
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          {msg.uiAction.details}
                        </p>
                      )}
                      {(msg.navigation?.target || msg.uiAction?.target) && (
                        <button
                          type="button"
                          onClick={() => {
                            const target = msg.uiAction?.target || msg.navigation?.target
                            if (target && typeof window !== 'undefined') {
                              window.location.href = target
                            }
                            if (msg.uiAction?.selector) {
                              highlightElement(msg.uiAction.selector)
                            }
                          }}
                          className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-lg border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-900 shadow-2xs transition-colors hover:bg-amber-50 cursor-pointer"
                        >
                          <span>Open Screen</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

              {/* Auth Prompt Card */}
              {!support &&
                !isUser &&
                msg.uiAction &&
                ['open_auth_modal', 'open_sign_in', 'open_sign_up'].includes(
                  msg.uiAction.action,
                ) && (
                  <div className="ml-9 mt-2 w-[calc(100%-2.25rem)] max-w-[94%]">
                    <AuthPromptCard
                      defaultView={
                        msg.uiAction.target === 'sign-up' || msg.uiAction.action === 'open_sign_up'
                          ? 'sign-up'
                          : 'sign-in'
                      }
                      onContinue={() => sendPrompt('Please continue with my booking')}
                    />
                  </div>
                )}

              {/* Confirmed Booking Card */}
              {!support && !isUser && msg.confirmedBooking && (
                <div className="ml-9 mt-2 w-[calc(100%-2.25rem)] max-w-[94%]">
                  <ConfirmedBookingCard booking={msg.confirmedBooking} />
                </div>
              )}

              {/* Stylist Selection Cards (Prioritized first when present; dismissed once selected/answered) */}
              {!support &&
                !isUser &&
                !hasReplied &&
                !dismissedStylistMsgIds[msg.id] &&
                msg.stylists &&
                msg.stylists.length > 0 && (
                  <div className="ml-9 mt-2 w-[calc(100%-2.25rem)] max-w-[94%] space-y-1.5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
                    <p className="px-0.5 text-[11px] font-medium text-stone-400">
                      {msg.stylists.length} stylist option{msg.stylists.length === 1 ? '' : 's'} —
                      tap one to select
                    </p>
                    {msg.stylists.map((stylist) => (
                      <StylistCard
                        key={stylist.id}
                        stylist={stylist}
                        onSelect={(st) => handleSelectStylist(st, msg.id)}
                      />
                    ))}
                  </div>
                )}

              {/* Service Recommendation Cards (Dismissed once selected/answered) */}
              {!support &&
                !isUser &&
                !hasReplied &&
                !dismissedServiceMsgIds[msg.id] &&
                effectiveRecs.length > 0 &&
                (isServicesHidden ? (
                  <div className="ml-9 mt-2 flex w-[calc(100%-2.25rem)] max-w-[94%] items-center justify-between rounded-xl border border-stone-200/80 bg-white/90 px-3 py-1.5 text-xs text-stone-600 shadow-2xs motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
                    <span className="flex items-center gap-1.5 font-medium text-[11px]">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      <span>
                        {effectiveRecs.length} service option{effectiveRecs.length === 1 ? '' : 's'}{' '}
                        hidden
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setHiddenServicesMsgIds((prev) => ({ ...prev, [msg.id]: false }))
                      }
                      className="font-semibold text-amber-800 hover:text-amber-900 cursor-pointer text-[11px]"
                    >
                      Show
                    </button>
                  </div>
                ) : (
                  <div className="ml-9 mt-2 w-[calc(100%-2.25rem)] max-w-[94%] space-y-1.5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
                    <div className="flex items-center justify-between px-0.5">
                      <p className="text-[11px] font-medium text-stone-400">
                        {effectiveRecs.length === 1
                          ? 'A pick for you'
                          : `${effectiveRecs.length} options — tap one to book`}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setHiddenServicesMsgIds((prev) => ({ ...prev, [msg.id]: true }))
                        }
                        title="Close recommended services"
                        className="rounded-md p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 cursor-pointer transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span className="sr-only">Close recommended services</span>
                      </button>
                    </div>
                    {effectiveRecs.map((rec, recIdx) => (
                      <ServiceCard
                        key={rec.serviceId}
                        service={rec}
                        index={effectiveRecs.length > 1 ? recIdx + 1 : undefined}
                        onSelect={(srv) => handleSelectService(srv, msg.id)}
                      />
                    ))}
                    {isLatestAssistant &&
                      effectiveRecs.length === CONCIERGE_RECOMMENDATION_LIMIT && (
                        <button
                          type="button"
                          disabled={isThinking}
                          onClick={() => sendPrompt(SHOW_MORE_PROMPT)}
                          className="w-full py-1.5 text-center text-xs font-medium text-stone-500 transition-colors hover:text-amber-800 cursor-pointer disabled:opacity-40"
                        >
                          Show a few more
                        </button>
                      )}
                  </div>
                ))}

              {/* Organization Cards (Dismissed once selected/answered) */}
              {!support &&
                !isUser &&
                !hasReplied &&
                !dismissedOrgMsgIds[msg.id] &&
                effectiveOrgs.length > 0 && (
                  <div className="ml-9 mt-2 w-[calc(100%-2.25rem)] max-w-[94%] space-y-1.5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
                    <p className="px-0.5 text-[11px] font-medium text-stone-400">
                      {effectiveOrgs.length} salon{effectiveOrgs.length === 1 ? '' : 's'} nearby
                    </p>
                    {effectiveOrgs.map((org) => (
                      <OrganizationCard
                        key={org.id}
                        org={org}
                        onShowServices={(name) => handleSelectOrg(name, msg.id)}
                      />
                    ))}
                  </div>
                )}

              {!isUser && renderExtras && (
                <div className="ml-9 mt-2 w-[calc(100%-2.25rem)] max-w-[94%]">
                  {renderExtras(msg)}
                </div>
              )}
            </div>
          )
        })}

        {/* Welcome suggestions */}
        {isOnlyWelcome && (
          <div className="ml-9 grid w-[calc(100%-2.25rem)] grid-cols-2 gap-2">
            {chrome.welcomeSuggestions.map((card) => {
              const Icon = card.icon
              return (
                <button
                  key={card.prompt}
                  type="button"
                  disabled={isThinking}
                  onClick={() => sendPrompt(card.prompt)}
                  className={cn(
                    'flex flex-col items-start rounded-2xl border border-stone-200/80 bg-white p-3 text-left shadow-2xs transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 disabled:opacity-40',
                    chrome.suggestionHover,
                    chrome.ring,
                  )}
                >
                  <span
                    className={cn(
                      'mb-2 flex h-9 w-9 items-center justify-center rounded-full',
                      portal === 'merchant' && 'bg-teal-50 text-teal-700',
                      portal === 'admin' && 'bg-sky-50 text-sky-700',
                      portal === 'client' && 'bg-amber-50 text-amber-700',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[13px] font-semibold text-stone-950">{card.label}</span>
                  <span className="mt-0.5 text-[11px] leading-snug text-stone-500">
                    {card.hint}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex max-w-[85%] items-end gap-2 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
            <ConciergeAvatar size="sm" portal={portal} />
            <div className="rounded-[1.15rem] rounded-bl-md border border-stone-200/70 bg-white px-3.5 py-2.5 shadow-2xs">
              <span className="sr-only">{chrome.title} is typing</span>
              <div className="flex items-center gap-2" aria-hidden="true">
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full motion-safe:animate-bounce [animation-delay:-0.3s]',
                      chrome.typingDot,
                    )}
                  />
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full motion-safe:animate-bounce [animation-delay:-0.15s]',
                      chrome.typingDot,
                    )}
                  />
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full motion-safe:animate-bounce',
                      chrome.typingDot,
                    )}
                  />
                </div>
                <span className="text-[11px] font-medium text-stone-400">
                  {chrome.thinkingLabel}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Jump to bottom button */}
      {isScrolledUp && (
        <div className="absolute bottom-[7.5rem] left-1/2 z-20 -translate-x-1/2 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className={cn(
              'flex items-center gap-1 rounded-full bg-stone-950/95 px-3 py-1.5 text-xs font-medium text-white shadow-md shadow-black/15 transition-colors hover:bg-stone-800 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2',
              chrome.ring,
            )}
          >
            Latest
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Quick Suggestions / Chips */}
      {!isOnlyWelcome && activeChips.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 pb-1 pt-1 scrollbar-none">
          {activeChips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isThinking}
              onClick={() => sendPrompt(chip)}
              className={cn(
                'shrink-0 rounded-full border border-stone-200/90 bg-white px-3 py-1.5 text-[11px] font-medium text-stone-600 shadow-2xs transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40',
                chrome.chipHover,
                chrome.ring,
              )}
            >
              {chip === SHOW_MORE_PROMPT ? 'A few more' : chip}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="border-t border-stone-200/70 bg-white/95 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        {/* Telegram-style reply preview */}
        {replyContext && (
          <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border-l-4 border-l-amber-500 bg-stone-100/95 p-2 pl-3 shadow-2xs backdrop-blur-md transition-all motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {replyContext.imageUrl ? (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-stone-200 border border-stone-200/80">
                  <Image
                    src={replyContext.imageUrl}
                    alt={replyContext.serviceName}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Sparkles className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Replying to service
                  </span>
                  {replyContext.organizationName && (
                    <>
                      <span className="text-stone-300">•</span>
                      <span className="text-[11px] font-medium text-stone-500 truncate">
                        {replyContext.organizationName}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs font-bold text-stone-900 truncate">
                  {replyContext.serviceName}
                </p>
                {(replyContext.basePrice !== undefined ||
                  replyContext.durationMinutes !== undefined) && (
                  <p className="text-[11px] text-stone-500 truncate">
                    {replyContext.basePrice !== undefined && `$${replyContext.basePrice}`}
                    {replyContext.durationMinutes !== undefined &&
                      ` • ${replyContext.durationMinutes}m`}
                  </p>
                )}
              </div>
            </div>
            {onClearReplyContext && (
              <button
                type="button"
                onClick={onClearReplyContext}
                aria-label="Cancel reply"
                title="Cancel reply"
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (canSend) {
              justSentRef.current = true
              onSend()
            }
          }}
          className={cn(
            'flex items-end gap-2 rounded-[1.35rem] border border-stone-200 bg-stone-50/80 p-1.5 pl-3.5 transition-all focus-within:bg-white focus-within:ring-2',
            chrome.focusWithin,
          )}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              replyContext ? `Ask about ${replyContext.serviceName}...` : chrome.placeholder
            }
            className="max-h-[120px] flex-1 resize-none bg-transparent py-2 text-[16px] leading-relaxed sm:text-[13px] text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
          />

          {!prompt.trim() && onTryVoice && (
            <button
              type="button"
              onClick={onTryVoice}
              aria-label={support ? 'Use voice help' : 'Use voice concierge'}
              title="Talk instead"
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2',
                portal === 'merchant' && 'hover:bg-teal-50 hover:text-teal-700',
                portal === 'admin' && 'hover:bg-sky-50 hover:text-sky-700',
                portal === 'client' && 'hover:bg-amber-50 hover:text-amber-700',
                chrome.ring,
              )}
            >
              <Mic className="h-4 w-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-xs transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2',
              chrome.ring,
              canSend ? chrome.sendReady : 'bg-stone-300',
            )}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
