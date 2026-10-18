'use client'

import { Sparkles } from 'lucide-react'
import { useState } from 'react'

import { ChatConversation, ChatPanelShell } from '@/components/chat/chat-ui'
import { useAgentChat } from '@/components/chat/useAgentChat'
import { VoiceAgentView } from '@/components/chat/VoiceAgentView'
import { anyChatFeatureEnabled, features } from '@/lib/features'
import { cn } from '@/lib/utils'

type Mode = 'chat' | 'voice'

function initialMode(): Mode {
  if (features.agentChat) return 'chat'
  if (features.voiceAgent) return 'voice'
  return 'chat'
}

export interface ChatWidgetProps {
  /** Controlled open state — omit for floating FAB ownership. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Hide floating FABs when the host already provides triggers. */
  showTriggers?: boolean
  className?: string
}

/**
 * Floating text + LiveKit voice agent shell.
 * Browser only joins LiveKit / renders UI — STT/LLM/TTS/RAG run on the backend worker.
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

  if (!anyChatFeatureEnabled) return null

  const handleOpenChat = () => {
    setMode('chat')
    setIsOpen(true)
  }

  return (
    <>
      {showTriggers && !isOpen && (
        <div className={cn('fixed bottom-6 right-6 z-40', className)}>
          <button
            type="button"
            onClick={handleOpenChat}
            aria-label="Open chat"
            className="group relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-stone-700/80 bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-amber-400/50 hover:shadow-[0_15px_30px_-5px_rgba(245,158,11,0.25)] active:scale-95"
            title="Chat with us"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/15 text-amber-400 transition-transform duration-300 group-hover:scale-110 group-hover:bg-amber-400/25">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </span>
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-stone-950 bg-amber-400" />
            </span>
            <span className="sr-only">Chat with us</span>
          </button>
        </div>
      )}

      {isOpen && (
        <ChatPanelShell
          mode={mode}
          onModeChange={setMode}
          onClose={() => setIsOpen(false)}
          showModeToggle={features.agentChat && features.voiceAgent}
        >
          {mode === 'voice' && features.voiceAgent ? (
            <VoiceAgentView
              language={features.defaultLanguage}
              onClose={() => setIsOpen(false)}
              onSwitchToText={features.agentChat ? () => setMode('chat') : () => setIsOpen(false)}
            />
          ) : (
            <ChatConversation
              messages={chat.messages}
              isThinking={chat.isThinking}
              prompt={chat.prompt}
              onPromptChange={chat.setPrompt}
              onSend={chat.send}
              onSelectService={(rec) => chat.send(`Book ${rec.name} at ${rec.organizationName}`)}
              onTryVoice={features.voiceAgent ? () => setMode('voice') : undefined}
            />
          )}
        </ChatPanelShell>
      )}
    </>
  )
}
