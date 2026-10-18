'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'

import { toastColor } from '@/constant/toast-color'
import {
  type AssistantPortal,
  isSupportPortal,
  welcomeMessageForPortal,
} from '@/lib/assistant-portal'
import { features } from '@/lib/features'
import { formatClockTime } from '@/lib/format'
import { createSequentialId } from '@/lib/ids'
import { type GeoCoords, requestGeolocation } from '@/lib/util/geo'
import { useClientConciergeChatMutation } from '@/store/api/clientApi'
import { setAuthData } from '@/store/authSlice'

export interface AgentServiceRecommendation {
  serviceId: string
  organizationId: string
  name: string
  organizationName: string
  organizationPicture?: string | null
  imageUrl?: string | null
  basePrice: number
  durationMinutes: number
  categoryName?: string | null
  description?: string | null
  physicalAddress?: string | null
  distanceKm?: number | null
}

export interface AgentOrganizationRecommendation {
  id: string
  name: string
  description?: string | null
  picture?: string | null
  physicalAddress?: string | null
  rating?: number
  serviceCount?: number
  distanceKm?: number | null
}

export interface AgentConfirmedBooking {
  id: string
  serviceName: string
  organizationName?: string | null
  startsAt: string
  formattedTime?: string | null
  totalPrice: number
  status: string
}

export interface AgentChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  time: string
  recommendations?: AgentServiceRecommendation[]
  organizations?: AgentOrganizationRecommendation[]
  confirmedBooking?: AgentConfirmedBooking | null
}

export interface UseAgentChatOptions {
  portal?: AssistantPortal
}

function welcomeMessage(portal: AssistantPortal): AgentChatMessage {
  return {
    id: 'msg-welcome',
    sender: 'assistant',
    text: welcomeMessageForPortal(portal),
    time: 'Just now',
  }
}

export function useAgentChat(options: UseAgentChatOptions = {}) {
  const portal = options.portal ?? 'client'
  const support = isSupportPortal(portal)
  const dispatch = useDispatch()
  const [messages, setMessages] = useState<AgentChatMessage[]>(() => [welcomeMessage(portal)])
  const [prompt, setPrompt] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<GeoCoords | null>(null)
  const historyRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const portalRef = useRef(portal)
  const [clientConciergeChat] = useClientConciergeChatMutation()

  useEffect(() => {
    if (portalRef.current === portal) return
    portalRef.current = portal
    historyRef.current = []
    setMessages([welcomeMessage(portal)])
    setPrompt('')
    setError(null)
  }, [portal])

  useEffect(() => {
    if (support) return
    void requestGeolocation({ enableHighAccuracy: false, timeout: 5000 })
      .then(setLocation)
      .catch(() => {
        /* best-effort fallback */
      })
  }, [support])

  const send = useCallback(
    async (customPrompt?: string) => {
      if (!features.agentChat) return
      const query = (customPrompt ?? prompt).trim()
      if (!query) return

      const userMsg: AgentChatMessage = {
        id: createSequentialId('usr'),
        sender: 'user',
        text: query,
        time: formatClockTime(),
      }
      setMessages((prev) => [...prev, userMsg])
      setPrompt('')
      setIsThinking(true)
      setError(null)

      try {
        const data = await clientConciergeChat({
          message: query,
          language: features.defaultLanguage,
          history: historyRef.current,
          portal,
          user_lat: support ? null : (location?.lat ?? null),
          user_lng: support ? null : (location?.lng ?? null),
        }).unwrap()

        if (!support && data.auth_token && data.user) {
          dispatch(
            setAuthData({
              user: data.user,
              access_token: data.auth_token,
              portal: 'client',
            }),
          )
          toast.success(`Signed in as ${data.user.email}`, toastColor.success)
        }

        const nextHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [
          ...historyRef.current,
          { role: 'user', content: query },
          { role: 'assistant', content: data.reply },
        ]
        historyRef.current = nextHistory.slice(-12)

        const recommendations: AgentServiceRecommendation[] = support
          ? []
          : (data.recommendations ?? []).map((r) => ({
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

        const organizations: AgentOrganizationRecommendation[] = support
          ? []
          : (data.organizations ?? []).map((o) => ({
              id: o.id,
              name: o.name,
              description: o.description,
              picture: o.picture,
              physicalAddress: o.physical_address,
              rating: o.rating ?? 4.9,
              serviceCount: o.service_count ?? 0,
              distanceKm: o.distance_km,
            }))

        const confirmedBooking: AgentConfirmedBooking | null =
          !support && data.confirmed_booking
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

        if (confirmedBooking) {
          toast.success(
            `Booking confirmed for ${confirmedBooking.serviceName}! $0 hold placed.`,
            toastColor.success,
          )
        }

        setMessages((prev) => [
          ...prev,
          {
            id: createSequentialId('ast'),
            sender: 'assistant',
            text: data.reply,
            time: formatClockTime(),
            recommendations: recommendations.length > 0 ? recommendations : undefined,
            organizations: organizations.length > 0 ? organizations : undefined,
            confirmedBooking,
          },
        ])
      } catch (err) {
        const status = (err as { status?: number })?.status
        const fallback =
          status === 401
            ? support
              ? 'Sign in to chat with the help assistant.'
              : 'Sign in to chat with the AI concierge grounded in live salon data.'
            : "I couldn't reach the assistant just now. Try again in a moment."
        setError(fallback)
        setMessages((prev) => [
          ...prev,
          {
            id: createSequentialId('ast'),
            sender: 'assistant',
            text: fallback,
            time: formatClockTime(),
          },
        ])
      } finally {
        setIsThinking(false)
      }
    },
    [clientConciergeChat, prompt, location, dispatch, portal, support],
  )

  return {
    messages,
    messagesEndRef,
    prompt,
    setPrompt,
    isThinking,
    error,
    send,
    portal,
  }
}
