'use client'

import dynamic from 'next/dynamic'
import React from 'react'

import { ChatConversation, ChatPanelShell } from '@/components/chat/chat-ui'
import type { AgentServiceRecommendation } from '@/components/chat/useAgentChat'

const VoiceAgentView = dynamic(
  () => import('@/components/chat/VoiceAgentView').then((mod) => mod.VoiceAgentView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Connecting voice agent…
      </div>
    ),
  },
)
import type { ConciergeMessage } from '@/hooks/use-ai-concierge'
import { INITIAL_STAFF } from '@/lib/data/catalog'
import { DEFAULT_TIME_SLOT, SERVICE_IMAGE_FALLBACK } from '@/lib/data/service-content'
import { features } from '@/lib/features'
import type { GeoCoords } from '@/lib/util/geo'
import type { SalonService, ServiceCategory, StaffMember } from '@/types'

import { ProposalCard } from './ProposalCard'

export interface AiConciergeProps {
  mode: 'voice' | 'chat'
  onModeChange: (mode: 'voice' | 'chat') => void
  prompt: string
  onPromptChange: (value: string) => void
  isThinking: boolean
  messages: ConciergeMessage[]
  /** @deprecated Scrolling is managed internally by ChatConversation */
  messagesEndRef?: React.RefObject<HTMLDivElement | null>
  onSend: (prompt?: string, service?: SalonService) => void
  onAuthorize: (opts: { service: SalonService; stylist?: StaffMember; slot?: string }) => void
  onClose: () => void
  userCoords?: GeoCoords | null
}

export function toSalonService(rec: AgentServiceRecommendation): SalonService {
  return {
    id: rec.serviceId,
    name: rec.name,
    category: (rec.categoryName || 'Haircuts') as ServiceCategory,
    durationMin: rec.durationMinutes,
    price: rec.basePrice,
    holdDeposit: Math.max(10, Math.round(rec.basePrice * 0.2)),
    noShowFee: Math.min(rec.basePrice, Math.max(15, Math.round(rec.basePrice * 0.15))),
    description: rec.description || 'Salon service',
    popular: rec.basePrice >= 80,
    imageUrl: rec.imageUrl || rec.organizationPicture || SERVICE_IMAGE_FALLBACK,
    organizationId: rec.organizationId,
    organizationName: rec.organizationName,
    distanceKm: rec.distanceKm ?? undefined,
  }
}

export function AiConcierge({
  mode,
  onModeChange,
  prompt,
  onPromptChange,
  isThinking,
  messages,
  messagesEndRef: _messagesEndRef,
  onSend,
  onAuthorize,
  onClose,
  userCoords,
}: AiConciergeProps) {
  const showModeToggle = features.agentChat && features.voiceAgent
  const voiceEnabled = features.voiceAgent
  const activeMode = mode === 'voice' && voiceEnabled ? 'voice' : 'chat'

  return (
    <ChatPanelShell
      mode={activeMode}
      onModeChange={onModeChange}
      onClose={onClose}
      showModeToggle={showModeToggle}
    >
      {activeMode === 'voice' ? (
        <VoiceAgentView
          language={features.defaultLanguage}
          initialLocation={userCoords}
          onClose={onClose}
          onSwitchToText={features.agentChat ? () => onModeChange('chat') : onClose}
        />
      ) : (
        <ChatConversation
          messages={messages}
          isThinking={isThinking}
          prompt={prompt}
          onPromptChange={onPromptChange}
          onSend={(p) => onSend(p)}
          onSelectService={(rec) =>
            onAuthorize({
              service: toSalonService(rec),
              stylist: INITIAL_STAFF[0],
              slot: DEFAULT_TIME_SLOT,
            })
          }
          onTryVoice={voiceEnabled ? () => onModeChange('voice') : undefined}
          renderExtras={(msg) => {
            if (
              msg.sender === 'assistant' &&
              (!msg.recommendations || msg.recommendations.length === 0) &&
              msg.hasProposal &&
              msg.proposedService
            ) {
              return <ProposalCard message={msg} onAuthorize={onAuthorize} />
            }
            return null
          }}
        />
      )}
    </ChatPanelShell>
  )
}

/** Target structure export name. */
export { AiConcierge as ConciergeDrawer }
