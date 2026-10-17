'use client'

import { Bot, Mic, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AgentChatView } from '@/components/chat/agent-chat-view'
import { useAgentChat } from '@/components/chat/use-agent-chat'
import { VoiceAgentView } from '@/components/chat/voice-agent-view'
import { anyChatFeatureEnabled, features } from '@/lib/features'
import { cn } from '@/lib/utils'

type Mode = 'text' | 'voice'

function initialMode(): Mode {
  if (features.agentChat) return 'text'
  if (features.voiceAgent) return 'voice'
  return 'text'
}

interface ChatWidgetProps {
  /** Controlled open state — omit for floating FAB ownership. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Hide floating FABs when the host already provides triggers. */
  showTriggers?: boolean
  className?: string
}

/**
 * Floating text + LiveKit voice agent shell (see frontend voice-agent guide).
 * Browser only joins LiveKit / renders UI — STT/LLM/TTS/RAG run on the worker.
 */
export function ChatWidget({
  open: openProp,
  onOpenChange,
  showTriggers = true,
  className,
}: ChatWidgetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : uncontrolledOpen
  const setIsOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  const [mode, setMode] = useState<Mode>(initialMode)
  const chat = useAgentChat()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  if (!anyChatFeatureEnabled) return null

  const handleOpenVoice = () => {
    if (!features.voiceAgent) return
    setMode('voice')
    setIsOpen(true)
  }

  const handleOpenChat = () => {
    if (!features.agentChat) return
    setMode('text')
    setIsOpen(true)
  }

  return (
    <>
      {showTriggers && !isOpen && (
        <div
          className={cn('fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5', className)}
        >
          {features.voiceAgent && (
            <button
              type="button"
              onClick={handleOpenVoice}
              aria-label="Open voice agent"
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-700/80 text-white shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.15)] hover:bg-slate-800 hover:scale-105 transition-all cursor-pointer group"
              title="Speak with Voice Concierge"
            >
              <Mic className="h-5 w-5 text-amber-300 transition-transform group-hover:scale-110" />
            </button>
          )}
          {features.agentChat && (
            <button
              type="button"
              onClick={handleOpenChat}
              aria-label="Open AI chat"
              className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 border border-amber-300/60 text-slate-950 shadow-[0_8px_24px_-4px_rgba(245,158,11,0.45),inset_0_1px_0_0_rgba(255,255,255,0.35)] hover:scale-105 transition-all cursor-pointer group"
              title="Open AI Concierge Chat"
            >
              <Sparkles className="h-6 w-6 text-slate-950 transition-transform group-hover:scale-110" />
            </button>
          )}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:flex-row sm:justify-end bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <button
            type="button"
            aria-label="Close chat"
            onClick={() => setIsOpen(false)}
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

            {/* Concierge Header Bar */}
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
                    {mode === 'voice'
                      ? 'LiveKit Voice Rails · Real-time'
                      : 'RAG Catalog · Zero-Debit Bookings'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {features.agentChat && features.voiceAgent && (
                  <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setMode('text')}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
                        mode === 'text'
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70'
                          : 'text-slate-500 hover:text-slate-900',
                      )}
                    >
                      <Bot className="h-3.5 w-3.5" />
                      <span>Chat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('voice')}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
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
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 shadow-xs transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </header>

            {mode === 'voice' && features.voiceAgent ? (
              <VoiceAgentView
                language={features.defaultLanguage}
                onClose={() => setIsOpen(false)}
                onSwitchToText={features.agentChat ? () => setMode('text') : () => setIsOpen(false)}
              />
            ) : (
              <AgentChatView
                messages={chat.messages}
                messagesEndRef={chat.messagesEndRef}
                isThinking={chat.isThinking}
                prompt={chat.prompt}
                onPromptChange={chat.setPrompt}
                onSend={chat.send}
                onTryVoice={
                  features.voiceAgent
                    ? () => {
                        setMode('voice')
                      }
                    : undefined
                }
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
