'use client'

import { useEffect, useState } from 'react'

import { ChatConversation, ChatPanelShell } from '@/components/chat/chat-ui'
import { useAgentChat } from '@/components/chat/useAgentChat'
import { VoiceAgentView } from '@/components/chat/VoiceAgentView'
import { type AssistantPortal, isSupportPortal, portalChrome } from '@/lib/assistant-portal'
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
  /** client booking concierge vs merchant/admin help desk */
  portal?: AssistantPortal
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
  portal = 'client',
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
  const chat = useAgentChat({ portal })
  const support = isSupportPortal(portal)
  const chrome = portalChrome(portal)
  const FabIcon = chrome.Icon

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: Mode }>
      if (customEvent.detail?.mode) {
        setMode(customEvent.detail.mode)
      }
      if (!isControlled) {
        setUncontrolledOpen(true)
      }
      onOpenChange?.(true)
    }
    window.addEventListener('salondesk:open_chat', handleOpen)
    return () => window.removeEventListener('salondesk:open_chat', handleOpen)
  }, [isControlled, onOpenChange])

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
            aria-label={chrome.fabLabel}
            title={chrome.fabTitle}
            className={cn(
              'group relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95',
              chrome.fabButton,
            )}
          >
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110',
                chrome.fabIconWrap,
              )}
            >
              <FabIcon className={cn('h-5 w-5', chrome.fabIcon)} />
            </span>
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span
                className={cn(
                  'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
                  chrome.fabPing,
                )}
              />
              <span
                className={cn(
                  'relative inline-flex h-3.5 w-3.5 rounded-full border-2',
                  chrome.fabDot,
                )}
              />
            </span>
            <span className="sr-only">{chrome.fabLabel}</span>
          </button>
        </div>
      )}

      {isOpen && (
        <ChatPanelShell
          mode={mode}
          portal={portal}
          onModeChange={setMode}
          onClose={() => setIsOpen(false)}
          showModeToggle={features.agentChat && features.voiceAgent}
        >
          {mode === 'voice' && features.voiceAgent ? (
            <VoiceAgentView
              language={features.defaultLanguage}
              portal={portal}
              onClose={() => setIsOpen(false)}
              onSwitchToText={features.agentChat ? () => setMode('chat') : () => setIsOpen(false)}
            />
          ) : (
            <ChatConversation
              portal={portal}
              messages={chat.messages}
              isThinking={chat.isThinking}
              prompt={chat.prompt}
              onPromptChange={chat.setPrompt}
              onSend={chat.send}
              onSelectService={
                support
                  ? undefined
                  : (rec) => chat.send(`Book ${rec.name} at ${rec.organizationName}`)
              }
              onTryVoice={features.voiceAgent ? () => setMode('voice') : undefined}
            />
          )}
        </ChatPanelShell>
      )}
    </>
  )
}
