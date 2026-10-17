'use client'

import { Bot, Clock, Lock, Mic, Send, Sparkles, User, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { VoiceAgentView } from '@/components/chat'
import { Button } from '@/components/ui'
import type { ConciergeMessage } from '@/hooks/use-ai-concierge'
import { INITIAL_STAFF } from '@/lib/data/catalog'
import { DEFAULT_TIME_SLOT } from '@/lib/data/service-content'
import { features } from '@/lib/features'
import { cn } from '@/lib/utils'
import type { SalonService, StaffMember } from '@/types'

interface AiConciergeProps {
  mode: 'voice' | 'chat'
  onModeChange: (mode: 'voice' | 'chat') => void
  prompt: string
  onPromptChange: (value: string) => void
  isThinking: boolean
  messages: ConciergeMessage[]
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onSend: (prompt?: string, service?: SalonService) => void
  onAuthorize: (opts: { service: SalonService; stylist?: StaffMember; slot?: string }) => void
  onClose: () => void
}

export function AiConcierge({
  mode,
  onModeChange,
  prompt,
  onPromptChange,
  isThinking,
  messages,
  messagesEndRef,
  onSend,
  onAuthorize,
  onClose,
}: AiConciergeProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const showModeToggle = features.agentChat && features.voiceAgent
  const voiceEnabled = features.voiceAgent
  const activeMode = mode === 'voice' && voiceEnabled ? 'voice' : 'chat'

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:flex-row sm:justify-end bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <button
        type="button"
        aria-label="Close concierge"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="SalonDesk Concierge"
        className="relative z-10 flex h-[92vh] sm:h-[calc(100vh-2rem)] w-full max-w-full sm:max-w-md sm:m-4 flex-col rounded-t-2xl sm:rounded-xl bg-white text-slate-900 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.9)] border border-slate-200/90 overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-right-6 duration-250"
      >
        <div className="pt-2.5 pb-1 sm:hidden flex justify-center bg-white">
          <div className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4.5 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-amber-200/70 bg-gradient-to-br from-amber-50 to-amber-100/60 shadow-xs">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
              </span>
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-slate-900">
                SalonDesk Concierge
              </h2>
              <p className="font-mono text-[10px] text-slate-400">
                {activeMode === 'voice'
                  ? 'LiveKit Voice Rails · Real-time'
                  : 'Gemini 2.5 · Zero-Debit Bookings'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showModeToggle && (
              <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => onModeChange('chat')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
                    activeMode === 'chat'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70'
                      : 'text-slate-500 hover:text-slate-900',
                  )}
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('voice')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
                    activeMode === 'voice'
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
              aria-label="Close"
              className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {activeMode === 'voice' ? (
          <VoiceAgentView
            language={features.defaultLanguage}
            onClose={onClose}
            onSwitchToText={features.agentChat ? () => onModeChange('chat') : onClose}
          />
        ) : (
          <ChatSurface
            messages={messages}
            messagesEndRef={messagesEndRef}
            isThinking={isThinking}
            prompt={prompt}
            onPromptChange={onPromptChange}
            onSend={onSend}
            onAuthorize={onAuthorize}
            onTryVoice={voiceEnabled ? () => onModeChange('voice') : undefined}
          />
        )}
      </div>
    </div>
  )
}

function ChatSurface({
  messages,
  messagesEndRef,
  isThinking,
  prompt,
  onPromptChange,
  onSend,
  onAuthorize,
  onTryVoice,
}: {
  messages: ConciergeMessage[]
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  isThinking: boolean
  prompt: string
  onPromptChange: (value: string) => void
  onSend: (prompt?: string) => void
  onAuthorize: (opts: { service: SalonService; stylist?: StaffMember; slot?: string }) => void
  onTryVoice?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-1 flex-col justify-between overflow-hidden bg-[#FAFAFA]">
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

              {!isUser && msg.hasProposal && msg.proposedService && (
                <ProposalCard message={msg} onAuthorize={onAuthorize} />
              )}
            </div>
          )
        })}

        {isThinking && (
          <div className="flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)]">
            <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-500" />
            <span className="font-mono text-[11px]">Finding available appointment slots…</span>
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
            <span className="text-xs font-semibold text-slate-800">Prefer voice consultation?</span>
          </div>
          <button
            type="button"
            onClick={onTryVoice}
            className="rounded-lg bg-stone-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 shadow-xs transition-all cursor-pointer"
          >
            Launch Voice Agent
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-200/70 bg-white/80 px-4 py-2 scrollbar-none snap-x">
        <button
          type="button"
          onClick={() => onSend('Book Precision Fade with Marcus')}
          className="snap-start shrink-0 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:border-amber-300 hover:bg-amber-50/60 hover:text-amber-950 transition-all cursor-pointer"
        >
          Fade with Marcus
        </button>
        <button
          type="button"
          onClick={() => onSend('Book Balayage this Saturday')}
          className="snap-start shrink-0 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:border-amber-300 hover:bg-amber-50/60 hover:text-amber-950 transition-all cursor-pointer"
        >
          Balayage this Saturday
        </button>
        <button
          type="button"
          onClick={() => onSend('How does the $0 hold work?')}
          className="snap-start shrink-0 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:border-amber-300 hover:bg-amber-50/60 hover:text-amber-950 transition-all cursor-pointer"
        >
          How $0 hold works
        </button>
      </div>

      <div className="border-t border-slate-200/80 bg-white/95 p-3 sm:p-4 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSend()
          }}
          className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-1 pl-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all"
        >
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Ask or book anything…"
            className="flex-1 bg-transparent py-1 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />

          <button
            type="submit"
            disabled={!prompt.trim() || isThinking}
            aria-label="Send"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-950 text-white hover:bg-amber-600 disabled:opacity-30 shadow-xs transition-colors cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  )
}

function ProposalCard({
  message,
  onAuthorize,
}: {
  message: ConciergeMessage
  onAuthorize: (opts: { service: SalonService; stylist?: StaffMember; slot?: string }) => void
}) {
  const service = message.proposedService
  if (!service) return null

  const stylist = message.proposedStylist || INITIAL_STAFF[0]
  const slot = message.proposedSlot || DEFAULT_TIME_SLOT

  return (
    <div className="mt-3 w-full max-w-[94%] rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-4 sm:p-5 text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)]">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h4 className="font-bold text-sm sm:text-base text-slate-900 truncate">{service.name}</h4>
        <span className="font-mono tabular-nums tracking-tight font-extrabold text-sm sm:text-base text-amber-900 shrink-0">
          ${service.price}
        </span>
      </div>

      <div className="mb-3.5 flex items-center justify-between text-xs text-slate-700 bg-white/90 border border-slate-200/70 rounded-lg px-3 py-2 shadow-xs">
        <span className="flex items-center gap-1.5 text-slate-800 font-medium">
          <User className="h-3.5 w-3.5 text-amber-600" />
          {stylist.name}
        </span>
        <span className="flex items-center gap-1.5 text-slate-800 font-medium">
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          {slot}
        </span>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={() =>
          onAuthorize({
            service,
            stylist,
            slot,
          })
        }
        className="w-full h-9 rounded-lg bg-stone-950 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs border-0"
      >
        <Lock className="h-3.5 w-3.5 mr-1.5" />
        <span>Hold with PayPal ($0 today) →</span>
      </Button>

      <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
        <span>${service.holdDeposit} hold authorization</span>
        <span className="text-emerald-700 font-semibold">Free 24h cancel</span>
      </div>
    </div>
  )
}

/** Target structure export name. */
export { AiConcierge as ConciergeDrawer }
