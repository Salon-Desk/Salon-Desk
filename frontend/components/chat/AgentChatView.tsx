'use client'

import React from 'react'

import { ChatConversation } from '@/components/chat/chat-ui'
import type { AgentChatMessage, AgentServiceRecommendation } from '@/components/chat/useAgentChat'

export interface AgentChatViewProps {
  messages: AgentChatMessage[]
  /** @deprecated Scrolling is managed internally by ChatConversation */
  messagesEndRef?: React.RefObject<HTMLDivElement | null>
  isThinking: boolean
  prompt: string
  onPromptChange: (value: string) => void
  onSend: (prompt?: string) => void
  onSelectService?: (service: AgentServiceRecommendation) => void
  onTryVoice?: () => void
  className?: string
}

export function AgentChatView({
  messages,
  messagesEndRef: _messagesEndRef,
  isThinking,
  prompt,
  onPromptChange,
  onSend,
  onSelectService,
  onTryVoice,
  className,
}: AgentChatViewProps) {
  return (
    <ChatConversation
      messages={messages}
      isThinking={isThinking}
      prompt={prompt}
      onPromptChange={onPromptChange}
      onSend={onSend}
      onSelectService={onSelectService}
      onTryVoice={onTryVoice}
      className={className}
    />
  )
}
