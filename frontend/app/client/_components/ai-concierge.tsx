'use client'

import { Bot, Clock, Lock, Mic, Send, Sparkles, User, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { VoiceAgentView } from '@/components/chat'
import { Button } from '@/components/ui'
import { INITIAL_STAFF } from '@/lib/data/catalog'
import { DEFAULT_TIME_SLOT } from '@/lib/data/service-content'
import { features } from '@/lib/features'
import type { SalonService, StaffMember } from '@/types'

import type { ConciergeMessage } from '../_hooks/use-ai-concierge'

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
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:flex-row sm:justify-end bg-stone-950/30 backdrop-blur-xs animate-in fade-in duration-200">
      <button
        type="button"
        aria-label="Close concierge"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI Concierge"
        className="relative z-10 flex h-[90vh] sm:h-full w-full max-w-full sm:max-w-md flex-col rounded-t-3xl sm:rounded-none bg-[#fbfbfa] text-stone-900 sm:border-l sm:border-stone-200/50 overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-right-8 duration-300"
      >
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="h-1 w-10 rounded-full bg-stone-300" />
        </div>

        <header className="flex items-center justify-between border-b border-stone-200/60 bg-white/80 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-900">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </span>
            </div>
            <div>
              <h2 className="font-serif text-sm font-medium tracking-tight text-stone-950">
                Atelier Concierge
              </h2>
              <p className="text-[10px] text-stone-500 font-normal">
                {activeMode === 'voice'
                  ? 'LiveKit voice · Instant booking'
                  : 'Gemini 2.5 · Instant booking'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showModeToggle && (
              <div className="flex items-center rounded-full bg-stone-100 p-0.5">
                <button
                  type="button"
                  onClick={() => onModeChange('chat')}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                    activeMode === 'chat'
                      ? 'bg-stone-950 text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-950'
                  }`}
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('voice')}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                    activeMode === 'voice'
                      ? 'bg-stone-950 text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-950'
                  }`}
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
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
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
    <div className="flex flex-1 flex-col justify-between overflow-hidden bg-[#fbfbfa]">
      <div className="flex-1 space-y-3.5 overflow-y-auto p-4 sm:p-5">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user'
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'rounded-tr-xs bg-stone-950 text-white font-normal'
                    : 'rounded-tl-xs bg-stone-100 text-stone-900 font-normal'
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
          <div className="flex w-fit items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-xs text-stone-600">
            <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-600" />
            <span>Finding available slots...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {onTryVoice && (
        <div className="border-t border-stone-200/50 bg-amber-50/50 px-4 py-2.5">
          <button
            type="button"
            onClick={onTryVoice}
            className="w-full rounded-2xl bg-stone-950 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600 cursor-pointer"
          >
            Try Voice Agent
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto border-t border-stone-200/50 bg-white/70 px-4 py-2.5 scrollbar-none snap-x">
        <button
          type="button"
          onClick={() => onSend('Book Precision Fade with Marcus')}
          className="snap-start shrink-0 rounded-full bg-stone-100 hover:bg-stone-200/80 px-3 py-1.5 text-xs font-normal text-stone-800 transition-colors cursor-pointer"
        >
          Fade with Marcus
        </button>
        <button
          type="button"
          onClick={() => onSend('Book Balayage this Saturday')}
          className="snap-start shrink-0 rounded-full bg-stone-100 hover:bg-stone-200/80 px-3 py-1.5 text-xs font-normal text-stone-800 transition-colors cursor-pointer"
        >
          Balayage this Saturday
        </button>
        <button
          type="button"
          onClick={() => onSend('How does the $0 hold work?')}
          className="snap-start shrink-0 rounded-full bg-stone-100 hover:bg-stone-200/80 px-3 py-1.5 text-xs font-normal text-stone-800 transition-colors cursor-pointer"
        >
          How $0 hold works
        </button>
      </div>

      <div className="border-t border-stone-200/50 bg-white p-3 sm:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSend()
          }}
          className="flex items-center gap-2 rounded-full bg-stone-100 p-1 pl-4"
        >
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Ask or book anything..."
            className="flex-1 bg-transparent py-1.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
          />

          <button
            type="submit"
            disabled={!prompt.trim() || isThinking}
            aria-label="Send"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-950 font-bold text-white transition-all hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
    <div className="mt-3 w-full max-w-[94%] rounded-3xl bg-amber-50/70 p-4 sm:p-5 text-stone-900 border border-amber-200/40">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h4 className="font-serif text-base text-stone-950 truncate font-normal">{service.name}</h4>
        <span className="font-semibold text-base text-stone-950 shrink-0">${service.price}</span>
      </div>

      <div className="mb-4 flex items-center justify-between text-xs text-stone-700 bg-white/80 rounded-2xl px-3 py-2">
        <span className="flex items-center gap-1.5 text-stone-800 font-medium">
          <User className="h-3.5 w-3.5 text-amber-600" />
          {stylist.name}
        </span>
        <span className="flex items-center gap-1.5 text-stone-800 font-medium">
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
        className="w-full py-2.5 font-medium text-xs sm:text-sm rounded-full bg-stone-950 hover:bg-stone-800 text-white cursor-pointer shadow-none border-0"
      >
        <Lock className="h-3.5 w-3.5" />
        <span>Hold with PayPal ($0 today) →</span>
      </Button>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-500 px-1">
        <span>${service.holdDeposit} hold authorization</span>
        <span>Free 24h cancel</span>
      </div>
    </div>
  )
}
