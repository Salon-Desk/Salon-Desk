'use client'

import { Mic, Send, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'

import type { AgentChatMessage } from '@/components/chat/use-agent-chat'
import { cn } from '@/lib/utils'

interface AgentChatViewProps {
  messages: AgentChatMessage[]
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  isThinking: boolean
  prompt: string
  onPromptChange: (value: string) => void
  onSend: (prompt?: string) => void
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
  onTryVoice,
  className,
}: AgentChatViewProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const count = messages.length

  useEffect(() => {
    if (count < 1) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [count, messagesEndRef])

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

              {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-2.5 w-full max-w-[94%] space-y-2">
                  {msg.recommendations.slice(0, 3).map((rec) => (
                    <div
                      key={rec.serviceId}
                      className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 p-3.5 text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)]"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="truncate font-bold text-xs sm:text-sm text-slate-900">
                          {rec.name}
                        </h4>
                        <span className="shrink-0 font-mono tabular-nums tracking-tight font-extrabold text-xs sm:text-sm text-amber-900">
                          ${rec.basePrice}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 font-mono">
                        {rec.organizationName}
                        {rec.durationMinutes ? ` · ${rec.durationMinutes} min` : ''}
                      </p>
                    </div>
                  ))}
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
        {['Find a fade near me', 'How does the $0 hold work?', 'Balayage this weekend'].map(
          (chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onSend(chip)}
              className="shrink-0 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:border-amber-300 hover:bg-amber-50/60 hover:text-amber-950 transition-all cursor-pointer"
            >
              {chip}
            </button>
          ),
        )}
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
            placeholder="Ask or book anything…"
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
