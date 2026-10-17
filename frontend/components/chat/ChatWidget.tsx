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
        <div className={cn('fixed bottom-5 right-5 z-40', className)}>
          <button
            type="button"
            onClick={handleOpenChat}
            aria-label="Open SalonDesk AI Concierge"
            className="group flex cursor-pointer items-center gap-2.5 rounded-full border border-stone-800 bg-stone-950/95 py-2.5 pl-3.5 pr-4 text-white shadow-lg shadow-black/20 backdrop-blur-md transition-all hover:border-stone-700 hover:bg-stone-900 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            title="Open AI Concierge"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/15 text-amber-400 transition-transform group-hover:scale-110">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold tracking-tight text-stone-100">
              AI Concierge
            </span>
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
