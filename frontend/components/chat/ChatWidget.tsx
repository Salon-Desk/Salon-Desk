'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { ChatConversation, ChatPanelShell } from '@/components/chat/chat-ui'
import { DraggableChatFab } from '@/components/chat/DraggableChatFab'
import { useAgentChat } from '@/components/chat/useAgentChat'
import { VoiceAgentView } from '@/components/chat/VoiceAgentView'
import { type AssistantPortal, isSupportPortal } from '@/lib/assistant-portal'
import { anyChatFeatureEnabled, features } from '@/lib/features'
import type { AppDispatch, RootState } from '@/store'
import { setChatMinimized, setChatMode, setChatOpen, setChatPortal } from '@/store/agentChatSlice'

export interface ChatWidgetProps {
  /** Controlled open state — omit for Redux / floating FAB ownership. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Hide floating FABs when the host already provides triggers. */
  showTriggers?: boolean
  /** client booking concierge vs merchant/admin help desk */
  portal?: AssistantPortal
  className?: string
}

/**
 * Floating text + LiveKit voice agent shell with drag-and-drop FAB,
 * voice minimization sound-effect widget, and global persistent state across route navigation.
 */
export function ChatWidget({
  open: openProp,
  onOpenChange,
  showTriggers = true,
  portal = 'client',
  className,
}: ChatWidgetProps) {
  const dispatch = useDispatch<AppDispatch>()
  const reduxOpen = useSelector((state: RootState) => state.agentChat?.isOpen ?? false)
  const isMinimized = useSelector((state: RootState) => state.agentChat?.isMinimized ?? false)
  const mode = useSelector((state: RootState) => state.agentChat?.mode ?? 'chat')

  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : reduxOpen

  const setIsOpen = (next: boolean) => {
    if (!isControlled) {
      dispatch(setChatOpen(next))
    }
    onOpenChange?.(next)
  }

  const setMode = (nextMode: 'chat' | 'voice') => {
    dispatch(setChatMode(nextMode))
  }

  useEffect(() => {
    dispatch(setChatPortal(portal))
  }, [portal, dispatch])

  const chat = useAgentChat({ portal })
  const support = isSupportPortal(portal)

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: 'chat' | 'voice' }>
      if (customEvent.detail?.mode) {
        dispatch(setChatMode(customEvent.detail.mode))
      }
      if (!isControlled) {
        dispatch(setChatOpen(true))
      }
      onOpenChange?.(true)
    }
    window.addEventListener('salondesk:open_chat', handleOpen)
    return () => window.removeEventListener('salondesk:open_chat', handleOpen)
  }, [isControlled, onOpenChange, dispatch])

  if (!anyChatFeatureEnabled) return null

  const handleOpenChat = () => {
    setMode('chat')
    setIsOpen(true)
  }

  return (
    <>
      {showTriggers && !isOpen && (
        <DraggableChatFab portal={portal} onClick={handleOpenChat} className={className} />
      )}

      {isOpen && (
        <>
          {mode === 'voice' && isMinimized ? (
            <VoiceAgentView
              language={features.defaultLanguage}
              portal={portal}
              isMinimized
              onMinimizeChange={(m) => dispatch(setChatMinimized(m))}
              onClose={() => setIsOpen(false)}
              onSwitchToText={features.agentChat ? () => setMode('chat') : () => setIsOpen(false)}
            />
          ) : (
            <ChatPanelShell
              mode={mode}
              portal={portal}
              onModeChange={setMode}
              onClose={() => setIsOpen(false)}
              onMinimize={mode === 'voice' ? () => dispatch(setChatMinimized(true)) : undefined}
              showModeToggle={features.agentChat && features.voiceAgent}
            >
              {mode === 'voice' && features.voiceAgent ? (
                <VoiceAgentView
                  language={features.defaultLanguage}
                  portal={portal}
                  isMinimized={false}
                  onMinimizeChange={(m) => dispatch(setChatMinimized(m))}
                  onClose={() => setIsOpen(false)}
                  onSwitchToText={
                    features.agentChat ? () => setMode('chat') : () => setIsOpen(false)
                  }
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
      )}
    </>
  )
}
