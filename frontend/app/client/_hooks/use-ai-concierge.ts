'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { INITIAL_SERVICES, INITIAL_STAFF } from '@/lib/data/catalog'
import { DEFAULT_TIME_SLOT } from '@/lib/data/service-content'
import { features } from '@/lib/features'
import { formatClockTime } from '@/lib/format'
import { createSequentialId } from '@/lib/ids'
import type { SalonService, StaffMember } from '@/types'

export interface ConciergeMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  time: string
  proposedService?: SalonService
  proposedStylist?: StaffMember
  proposedSlot?: string
  hasProposal?: boolean
}

const WELCOME: ConciergeMessage = {
  id: 'msg-welcome',
  sender: 'assistant',
  text: 'Hello! I am your SalonDesk AI Concierge at Crown & Blade Atelier. With our PayPal authorization hold guarantee, $0 is debited today to lock in your appointment. How may I style you today?',
  time: 'Just now',
  proposedService: INITIAL_SERVICES[0],
  proposedStylist: INITIAL_STAFF[0],
  proposedSlot: DEFAULT_TIME_SLOT,
  hasProposal: true,
}

function initialMode(): 'voice' | 'chat' {
  if (features.agentChat) return 'chat'
  if (features.voiceAgent) return 'voice'
  return 'chat'
}

export function useAiConcierge() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'voice' | 'chat'>(initialMode)
  const [prompt, setPrompt] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [messages, setMessages] = useState<ConciergeMessage[]>([WELCOME])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const messageCount = messages.length
  useEffect(() => {
    if (!isOpen || mode !== 'chat' || messageCount < 1) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [isOpen, mode, messageCount])

  const send = useCallback(
    async (customPrompt?: string, serviceOverride?: SalonService) => {
      const query = customPrompt || prompt
      if (!query.trim()) return

      const service = serviceOverride || INITIAL_SERVICES[0]
      const userMsg: ConciergeMessage = {
        id: createSequentialId('usr'),
        sender: 'user',
        text: query,
        time: formatClockTime(),
      }

      setMessages((prev) => [...prev, userMsg])
      setPrompt('')
      setIsThinking(true)

      try {
        const res = await fetch('/api/ai/concierge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            selectedServiceId: service.id,
          }),
        })
        const data = await res.json()
        const assistantMsg: ConciergeMessage = {
          id: createSequentialId('ast'),
          sender: 'assistant',
          text: data.replyText,
          time: formatClockTime(),
          proposedService: data.matchedService || service,
          proposedStylist: data.matchedStylist || INITIAL_STAFF[0],
          proposedSlot: data.proposedTimeSlot || DEFAULT_TIME_SLOT,
          hasProposal: data.hasProposal ?? true,
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: createSequentialId('ast'),
            sender: 'assistant',
            text: `I have reserved ${service.name} with ${INITIAL_STAFF[0].name} for ${DEFAULT_TIME_SLOT}. Remember: $0 leaves your account today—only an authorization hold of $${service.holdDeposit} is created via PayPal.`,
            time: formatClockTime(),
            proposedService: service,
            proposedStylist: INITIAL_STAFF[0],
            proposedSlot: DEFAULT_TIME_SLOT,
            hasProposal: true,
          },
        ])
      } finally {
        setIsThinking(false)
      }
    },
    [prompt],
  )

  return {
    isOpen,
    setIsOpen,
    mode,
    setMode,
    prompt,
    setPrompt,
    isThinking,
    messages,
    messagesEndRef,
    send,
  }
}
