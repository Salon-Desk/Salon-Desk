'use client'

import React from 'react'

import { ChatConversation } from '@/components/chat/chat-ui'
import type {
  AgentChatMessage,
  AgentChatReplyContext,
  AgentServiceRecommendation,
  AgentStylistRecommendation,
} from '@/components/chat/useAgentChat'

export interface AgentChatViewProps {
  messages: AgentChatMessage[]
  /** @deprecated Scrolling is managed internally by ChatConversation */
  messagesEndRef?: React.RefObject<HTMLDivElement | null>
  isThinking: boolean
  prompt: string
  onPromptChange: (value: string) => void
  onSend: (prompt?: string) => void
  replyContext?: AgentChatReplyContext | null
  onClearReplyContext?: () => void
  onSelectService?: (service: AgentServiceRecommendation) => void
  onSelectStylist?: (stylist: AgentStylistRecommendation) => void
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
  replyContext,
  onClearReplyContext,
  onSelectService,
  onSelectStylist,
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
      replyContext={replyContext}
      onClearReplyContext={onClearReplyContext}
      onSelectService={onSelectService}
      onSelectStylist={onSelectStylist}
      onTryVoice={onTryVoice}
      className={className}
    />
  )
}
