'use client'

import { useCallback, useRef, useState } from 'react'

import axiosInstance from '@/lib/axios'
import { features } from '@/lib/features'
import { formatClockTime } from '@/lib/format'
import { createSequentialId } from '@/lib/ids'

export interface AgentChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  time: string
  recommendations?: AgentServiceRecommendation[]
}

export interface AgentServiceRecommendation {
  serviceId: string
  organizationId: string
  name: string
  organizationName: string
  basePrice: number
  durationMinutes: number
  categoryName?: string | null
  description?: string | null
}

interface ChatApiResponse {
  reply: string
  recommendations?: Array<{
    service_id: string
    organization_id: string
    name: string
    organization_name: string
    base_price: string | number
    duration_minutes: number
    category_name?: string | null
    description?: string | null
  }>
}

const WELCOME: AgentChatMessage = {
  id: 'msg-welcome',
  sender: 'assistant',
  text: 'Hello! I am your SalonDesk AI Concierge. Ask about services, holds, or availability — $0 is debited today when you lock a PayPal authorization hold.',
  time: 'Just now',
}

export function useAgentChat() {
  const [messages, setMessages] = useState<AgentChatMessage[]>([WELCOME])
  const [prompt, setPrompt] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const historyRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
        const { data } = await axiosInstance.post<ChatApiResponse>('/api/v1/chat', {
          message: query,
          language: features.defaultLanguage,
          history: historyRef.current,
        })

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
          basePrice: Number(r.base_price),
          durationMinutes: r.duration_minutes,
          categoryName: r.category_name,
          description: r.description,
        }))

        setMessages((prev) => [
          ...prev,
          {
            id: createSequentialId('ast'),
            sender: 'assistant',
            text: data.reply,
            time: formatClockTime(),
            recommendations,
          },
        ])
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status
        const fallback =
          status === 401
            ? 'Sign in to chat with the AI concierge grounded in live salon data.'
            : 'I could not reach the assistant just now. Please try again in a moment.'
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
    [prompt],
  )

  return {
    messages,
    messagesEndRef,
    prompt,
    setPrompt,
    isThinking,
    error,
    send,
  }
}
