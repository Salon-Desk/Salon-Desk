'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  AgentConfirmedBooking,
  AgentOrganizationRecommendation,
  AgentServiceRecommendation,
} from '@/components/chat/useAgentChat'
import { INITIAL_SERVICES, INITIAL_STAFF } from '@/lib/data/catalog'
import { DEFAULT_TIME_SLOT } from '@/lib/data/service-content'
import { features } from '@/lib/features'
import { formatClockTime } from '@/lib/format'
import { createSequentialId } from '@/lib/ids'
import { type GeoCoords, requestGeolocation } from '@/lib/util/geo'
import { useClientConciergeChatMutation } from '@/store/api/clientApi'
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
  recommendations?: AgentServiceRecommendation[]
  organizations?: AgentOrganizationRecommendation[]
  confirmedBooking?: AgentConfirmedBooking | null
}

const WELCOME: ConciergeMessage = {
  id: 'msg-welcome',
  sender: 'assistant',
  text: 'Hello! I am your SalonDesk AI Concierge. With our PayPal authorization hold guarantee, $0 is debited today to lock in your appointment. How may I style you today?',
  time: 'Just now',
  hasProposal: false,
}

function initialMode(): 'voice' | 'chat' {
  if (features.agentChat) return 'chat'
  if (features.voiceAgent) return 'voice'
  return 'chat'
}

function demoFallbackMessage(_service?: SalonService): ConciergeMessage {
  return {
    id: createSequentialId('ast'),
    sender: 'assistant',
    text: 'I could not reach the booking assistant just now. Please try again in a moment, or select a service directly from the catalog.',
    time: formatClockTime(),
    hasProposal: false,
  }
}

export function useAiConcierge() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'voice' | 'chat'>(initialMode)
  const [prompt, setPrompt] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [messages, setMessages] = useState<ConciergeMessage[]>([WELCOME])
  const [location, setLocation] = useState<GeoCoords | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const isThinkingRef = useRef(false)
  const [clientConciergeChat] = useClientConciergeChatMutation()

  useEffect(() => {
    void requestGeolocation({ enableHighAccuracy: false, timeout: 5000 })
      .then(setLocation)
      .catch(() => {
        /* best-effort fallback */
      })
  }, [])

  const send = useCallback(
    async (customPrompt?: string, serviceOverride?: SalonService) => {
      if (isThinkingRef.current) return
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
      isThinkingRef.current = true
      setIsThinking(true)

      try {
        if (features.agentChat) {
          const data = await clientConciergeChat({
            message: query,
            language: features.defaultLanguage,
            history: historyRef.current,
            user_lat: location?.lat ?? null,
            user_lng: location?.lng ?? null,
          }).unwrap()

          const nextHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [
            ...historyRef.current,
            { role: 'user', content: query },
            { role: 'assistant', content: data.reply },
          ]
          historyRef.current = nextHistory.slice(-12)

          const recommendations = (data.recommendations ?? []).map((r) => ({
            serviceId: r.service_id,
            organizationId: r.organization_id,
            name: r.name,
            organizationName: r.organization_name,
            organizationPicture: r.organization_picture,
            imageUrl: r.image_url,
            basePrice: Number(r.base_price),
            durationMinutes: r.duration_minutes,
            categoryName: r.category_name,
            description: r.description,
            physicalAddress: r.physical_address,
            distanceKm: r.distance_km,
          }))

          const organizations = (data.organizations ?? []).map((o) => ({
            id: o.id,
            name: o.name,
            description: o.description,
            picture: o.picture,
            physicalAddress: o.physical_address,
            rating: o.rating ?? 4.9,
            serviceCount: o.service_count ?? 0,
            distanceKm: o.distance_km,
          }))

          const confirmedBooking = data.confirmed_booking
            ? {
                id: data.confirmed_booking.id,
                serviceName: data.confirmed_booking.service_name,
                organizationName: data.confirmed_booking.organization_name,
                startsAt: data.confirmed_booking.starts_at,
                formattedTime: data.confirmed_booking.formatted_time,
                totalPrice: Number(data.confirmed_booking.total_price),
                status: data.confirmed_booking.status,
              }
            : null

          const top = data.recommendations?.[0]
          const proposedFromApi: SalonService | undefined = top
            ? {
                ...service,
                id: top.service_id,
                name: top.name,
                price: Number(top.base_price),
                durationMin: top.duration_minutes,
                description: top.description ?? service.description,
                imageUrl: top.image_url ?? undefined,
                organizationId: top.organization_id,
                organizationName: top.organization_name,
              }
            : undefined

          setMessages((prev) => [
            ...prev,
            {
              id: createSequentialId('ast'),
              sender: 'assistant',
              text: data.reply,
              time: formatClockTime(),
              proposedService: proposedFromApi ?? service,
              proposedStylist: INITIAL_STAFF[0],
              proposedSlot: DEFAULT_TIME_SLOT,
              hasProposal: Boolean(proposedFromApi ?? service),
              recommendations,
              organizations,
              confirmedBooking,
            },
          ])
          return
        }

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
        setMessages((prev) => [...prev, demoFallbackMessage(service)])
      } finally {
        isThinkingRef.current = false
        setIsThinking(false)
      }
    },
    [clientConciergeChat, prompt, location],
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
