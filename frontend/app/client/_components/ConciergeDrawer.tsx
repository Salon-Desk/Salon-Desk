'use client'

import { Clock, Lock, User } from 'lucide-react'
import React from 'react'

import { ChatConversation, ChatPanelShell } from '@/components/chat/chat-ui'
import type { AgentServiceRecommendation } from '@/components/chat/useAgentChat'
import { VoiceAgentView } from '@/components/chat/VoiceAgentView'
import { Button } from '@/components/ui'
import type { ConciergeMessage } from '@/hooks/use-ai-concierge'
import { INITIAL_STAFF } from '@/lib/data/catalog'
import { DEFAULT_TIME_SLOT, SERVICE_IMAGE_FALLBACK } from '@/lib/data/service-content'
import { features } from '@/lib/features'
import type { GeoCoords } from '@/lib/util/geo'
import type { SalonService, ServiceCategory, StaffMember } from '@/types'

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

function ProposalCard({
  message,
  onAuthorize,
}: {
  message: ConciergeMessage
  onAuthorize: (opts: { service: SalonService; stylist?: StaffMember; slot?: string }) => void
}) {
  const service = message.proposedService
  if (!service) return null

  const stylist = message.proposedStylist || INITIAL_STAFF[0]
  const slot = message.proposedSlot || DEFAULT_TIME_SLOT

  return (
    <div className="mt-2.5 w-full rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 p-4 text-stone-900 shadow-xs">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h4 className="font-bold text-sm text-stone-900 truncate">{service.name}</h4>
        <span className="font-mono tabular-nums tracking-tight font-extrabold text-sm text-amber-950 shrink-0">
          ${service.price}
        </span>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-stone-700 bg-white/90 border border-stone-200/70 rounded-lg px-3 py-2 shadow-xs">
        <span className="flex items-center gap-1.5 text-stone-800 font-medium">
          <User className="h-3.5 w-3.5 text-amber-600" />
          {stylist.name}
        </span>
        <span className="flex items-center gap-1.5 text-stone-800 font-medium">
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          {slot}
        </span>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={() =>
          onAuthorize({
            service,
            stylist,
            slot,
          })
        }
        className="w-full h-9 rounded-lg bg-stone-950 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs border-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <Lock className="h-3.5 w-3.5 mr-1.5" />
        <span>Hold with PayPal ($0 today) →</span>
      </Button>

      <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-stone-500 px-0.5">
        <span>${service.holdDeposit} hold authorization</span>
        <span className="text-emerald-700 font-semibold">Free 24h cancel</span>
      </div>
    </div>
  )
}

/** Target structure export name. */
export { AiConcierge as ConciergeDrawer }
