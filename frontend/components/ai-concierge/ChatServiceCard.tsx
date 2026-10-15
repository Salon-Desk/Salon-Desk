'use client'

import { Send, Sparkles } from 'lucide-react'
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
      className={cn('flex flex-1 flex-col justify-between overflow-hidden bg-[#fbfbfa]', className)}
    >
      <div className="flex-1 space-y-3.5 overflow-y-auto p-4 sm:p-5">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user'
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'rounded-tr-xs bg-stone-950 text-white'
                    : 'rounded-tl-xs bg-stone-100 text-stone-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>

              {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-2 w-full max-w-[94%] space-y-2">
                  {msg.recommendations.slice(0, 3).map((rec) => (
                    <div
                      key={rec.serviceId}
                      className="rounded-2xl border border-amber-200/40 bg-amber-50/70 p-3 text-stone-900"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="truncate font-serif text-sm text-stone-950">{rec.name}</h4>
                        <span className="shrink-0 text-sm font-semibold">${rec.basePrice}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-stone-600">
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
          <div className="flex w-fit items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-xs text-stone-600">
            <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-600" />
            <span>Looking up services…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {onTryVoice && (
        <div className="border-t border-stone-200/50 bg-amber-50/40 px-4 py-2.5">
          <button
            type="button"
            onClick={onTryVoice}
            className="w-full rounded-2xl bg-stone-950 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600 cursor-pointer"
          >
            Try Voice Agent
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto border-t border-stone-200/50 bg-white/70 px-4 py-2.5 scrollbar-none">
        {['Find a fade near me', 'How does the $0 hold work?', 'Balayage this weekend'].map(
          (chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onSend(chip)}
              className="shrink-0 rounded-full bg-stone-100 px-3 py-1.5 text-xs text-stone-800 hover:bg-stone-200/80 cursor-pointer"
            >
              {chip}
            </button>
          ),
        )}
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
            placeholder="Ask or book anything…"
            className="flex-1 bg-transparent py-1.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isThinking}
            aria-label="Send"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-950 text-white hover:bg-amber-600 disabled:opacity-30 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
