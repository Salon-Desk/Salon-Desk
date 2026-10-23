'use client'

import { ArrowUpRight, ChevronDown, Mic, Send, Sparkles } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type {
  AgentConfirmedBooking,
  AgentOrganizationRecommendation,
  AgentServiceRecommendation,
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
  confirmedBooking?: AgentConfirmedBooking | null
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

export { AuthPromptCard, ConfirmedBookingCard, OrganizationCard, ServiceCard } from './ChatCards'
export { ChatPanelShell, type ChatPanelShellProps, ConciergeAvatar } from './ChatPanelShell'
export { RichText } from './RichText'

import { AuthPromptCard, ConfirmedBookingCard, OrganizationCard, ServiceCard } from './ChatCards'
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
  onSelectService?: (service: AgentServiceRecommendation) => void
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
  onSelectService,
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
  const [isScrolledUp, setIsScrolledUp] = useState(false)
  const isMountedRef = useRef(false)
  const justSentRef = useRef(false)

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

  const handleSelectService = (service: AgentServiceRecommendation) => {
    if (onSelectService) {
      onSelectService(service)
    } else {
      justSentRef.current = true
      onSend(`Book ${service.name} at ${service.organizationName}`)
    }
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

          return (
            <div key={msg.id} className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
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

              {/* Organization Cards */}
              {!support && !isUser && effectiveOrgs.length > 0 && (
                <div className="ml-9 mt-2 w-[calc(100%-2.25rem)] max-w-[94%] space-y-1.5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
                  <p className="px-0.5 text-[11px] font-medium text-stone-400">
                    {effectiveOrgs.length} salon{effectiveOrgs.length === 1 ? '' : 's'} nearby
                  </p>
                  {effectiveOrgs.map((org) => (
                    <OrganizationCard
                      key={org.id}
                      org={org}
                      onShowServices={(name) => sendPrompt(`Show services for ${name}`)}
                    />
                  ))}
                </div>
              )}

              {/* Service Recommendation Cards */}
              {!support && !isUser && effectiveRecs.length > 0 && (
                <div className="ml-9 mt-2 w-[calc(100%-2.25rem)] max-w-[94%] space-y-1.5 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
                  <p className="px-0.5 text-[11px] font-medium text-stone-400">
                    {effectiveRecs.length === 1
                      ? 'A pick for you'
                      : `${effectiveRecs.length} options — tap one to book`}
                  </p>
                  {effectiveRecs.map((rec, recIdx) => (
                    <ServiceCard
                      key={rec.serviceId}
                      service={rec}
                      index={effectiveRecs.length > 1 ? recIdx + 1 : undefined}
                      onSelect={handleSelectService}
                    />
                  ))}
                  {isLatestAssistant && effectiveRecs.length === CONCIERGE_RECOMMENDATION_LIMIT && (
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
            placeholder={chrome.placeholder}
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
