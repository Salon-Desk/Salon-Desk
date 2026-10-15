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
        <div className={cn('fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2', className)}>
          {features.voiceAgent && (
            <button
              type="button"
              onClick={handleOpenVoice}
              aria-label="Open voice agent"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-950 text-white shadow-lg hover:bg-amber-600 cursor-pointer"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
          {features.agentChat && (
            <button
              type="button"
              onClick={handleOpenChat}
              aria-label="Open AI chat"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-stone-950 shadow-lg hover:bg-amber-400 cursor-pointer"
            >
              <Sparkles className="h-6 w-6" />
            </button>
          )}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:flex-row sm:justify-end bg-stone-950/30 backdrop-blur-xs animate-in fade-in duration-200">
          <button
            type="button"
            aria-label="Close chat"
            onClick={() => setIsOpen(false)}
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
                  <p className="text-[10px] text-stone-500">
                    {mode === 'voice' ? 'LiveKit voice agent' : 'RAG chat · live catalog'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {features.agentChat && features.voiceAgent && (
                  <div className="flex items-center rounded-full bg-stone-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => setMode('text')}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer',
                        mode === 'text'
                          ? 'bg-stone-950 text-white shadow-xs'
                          : 'text-stone-500 hover:text-stone-950',
                      )}
                    >
                      <Bot className="h-3.5 w-3.5" />
                      <span>Chat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('voice')}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer',
                        mode === 'voice'
                          ? 'bg-stone-950 text-white shadow-xs'
                          : 'text-stone-500 hover:text-stone-950',
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
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-900 cursor-pointer"
                >
                  <X className="h-4 w-4" />
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
