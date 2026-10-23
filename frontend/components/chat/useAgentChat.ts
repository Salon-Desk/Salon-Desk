'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'

import { toastColor } from '@/constant/toast-color'
import { dispatchAgentUiAction, highlightElement } from '@/hooks/useAgentUiActions'
import { type AssistantPortal, isSupportPortal } from '@/lib/assistant-portal'
import { features } from '@/lib/features'
import { formatClockTime } from '@/lib/format'
import { createSequentialId } from '@/lib/ids'
import { type GeoCoords, requestGeolocation } from '@/lib/util/geo'
import type { RootState } from '@/store'
import { appendChatMessage, setChatPrompt } from '@/store/agentChatSlice'
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
  stylistName?: string | null
  startsAt: string
  formattedTime?: string | null
  servicePrice?: number | null
  platformFee?: number | null
  holdAmount?: number | null
  totalPrice: number
  freeCancelDeadline?: string | null
  freeCancelLabel?: string | null
  lateCancelFee?: number | null
  noShowFee?: number | null
  status: string
  paymentLink?: string | null
}

export interface AgentChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  time: string
  recommendations?: AgentServiceRecommendation[]
  organizations?: AgentOrganizationRecommendation[]
  confirmedBooking?: AgentConfirmedBooking | null
  navigation?: {
    target: string
    tab?: string | null
    label: string
    reason?: string | null
  } | null
  uiAction?: {
    action: string
    target?: string | null
    label?: string | null
    details?: string | null
    selector?: string | null
  } | null
}

export interface UseAgentChatOptions {
  portal?: AssistantPortal
}

export function useAgentChat(options: UseAgentChatOptions = {}) {
  const portal = options.portal ?? 'client'
  const support = isSupportPortal(portal)
  const dispatch = useDispatch()
  const router = useRouter()
  const messages = useSelector((state: RootState) => state.agentChat.messages)
  const prompt = useSelector((state: RootState) => state.agentChat.prompt)
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<GeoCoords | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [clientConciergeChat] = useClientConciergeChatMutation()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  useEffect(() => {
    if (support) return
    void requestGeolocation({ enableHighAccuracy: false, timeout: 5000 })
      .then(setLocation)
      .catch(() => {
        /* best-effort fallback */
      })
  }, [support])

  const setPrompt = useCallback(
    (value: string) => {
      dispatch(setChatPrompt(value))
    },
    [dispatch],
  )

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
      dispatch(appendChatMessage(userMsg))
      dispatch(setChatPrompt(''))
      setIsThinking(true)
      setError(null)

      const historyPayload: Array<{ role: 'user' | 'assistant'; content: string }> = [
        ...messages
          .filter((m) => !m.id.startsWith('msg-welcome'))
          .map((m) => ({ role: m.sender, content: m.text })),
      ].slice(-12)

      try {
        const data = await clientConciergeChat({
          message: query,
          language: features.defaultLanguage,
          history: historyPayload,
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

        type RawConfirmedBooking = {
          id: string
          service_id?: string
          service_name: string
          organization_name?: string | null
          stylist_name?: string | null
          starts_at: string
          formatted_time?: string | null
          service_price?: string | number | null
          platform_fee?: string | number | null
          hold_amount?: string | number | null
          total_price: string | number
          free_cancel_deadline?: string | null
          free_cancel_label?: string | null
          late_cancel_fee?: string | number | null
          no_show_fee?: string | number | null
          status: string
          payment_link?: string | null
        }
        const cb = data.confirmed_booking as RawConfirmedBooking | undefined
        const confirmedBooking: AgentConfirmedBooking | null =
          !support && cb
            ? {
                id: cb.id,
                serviceName: cb.service_name,
                organizationName: cb.organization_name,
                stylistName: cb.stylist_name,
                startsAt: cb.starts_at,
                formattedTime: cb.formatted_time,
                servicePrice:
                  cb.service_price != null ? Number(cb.service_price) : Number(cb.total_price),
                platformFee: cb.platform_fee != null ? Number(cb.platform_fee) : 0,
                holdAmount:
                  cb.hold_amount != null ? Number(cb.hold_amount) : Number(cb.total_price),
                totalPrice: Number(cb.total_price),
                freeCancelDeadline: cb.free_cancel_deadline,
                freeCancelLabel: cb.free_cancel_label,
                lateCancelFee: cb.late_cancel_fee != null ? Number(cb.late_cancel_fee) : null,
                noShowFee: cb.no_show_fee != null ? Number(cb.no_show_fee) : null,
                status: cb.status,
                paymentLink: data.payment_link || cb.payment_link,
              }
            : null

        // Handle payment link
        if (!support && data.payment_link) {
          toast.success(
            'Booking created! Review policy and complete your PayPal hold.',
            toastColor.success,
          )
          // Store payment link for display
          window.dispatchEvent(
            new CustomEvent('salondesk:payment_link', {
              detail: {
                bookingId: cb?.id,
                serviceId: cb?.service_id || cb?.service_name,
                serviceName: cb?.service_name,
                organizationName: cb?.organization_name,
                stylistName: cb?.stylist_name,
                startsAt: cb?.starts_at,
                formattedTime: cb?.formatted_time,
                servicePrice:
                  cb?.service_price != null ? Number(cb?.service_price) : Number(cb?.total_price),
                platformFee: cb?.platform_fee != null ? Number(cb?.platform_fee) : 0,
                holdAmount:
                  cb?.hold_amount != null ? Number(cb?.hold_amount) : Number(cb?.total_price),
                totalPrice: cb?.total_price,
                freeCancelDeadline: cb?.free_cancel_deadline,
                freeCancelLabel: cb?.free_cancel_label,
                lateCancelFee: cb?.late_cancel_fee != null ? Number(cb?.late_cancel_fee) : null,
                noShowFee: cb?.no_show_fee != null ? Number(cb?.no_show_fee) : null,
                paymentLink: data.payment_link,
              },
            }),
          )
        }

        if (confirmedBooking && !data.payment_link) {
          toast.success(
            `Booking confirmed for ${confirmedBooking.serviceName}! $0 hold placed.`,
            toastColor.success,
          )
        }

        if (data.navigation?.target) {
          router.push(data.navigation.target)
          dispatchAgentUiAction({
            type: 'navigate',
            portal,
            target: data.navigation.target,
            tab: data.navigation.tab || undefined,
            label: data.navigation.label,
            reason: data.navigation.reason || undefined,
          })
        }

        if (data.ui_action) {
          if (
            data.ui_action.target &&
            data.ui_action.target.startsWith('/') &&
            typeof window !== 'undefined' &&
            window.location.pathname !== data.ui_action.target
          ) {
            router.push(data.ui_action.target)
          }

          if (
            ['open_auth_modal', 'open_sign_in', 'open_sign_up'].includes(data.ui_action.action) &&
            typeof window !== 'undefined'
          ) {
            const view =
              data.ui_action.target === 'sign-up' || data.ui_action.action === 'open_sign_up'
                ? 'sign-up'
                : 'sign-in'
            window.dispatchEvent(
              new CustomEvent('salondesk:open_auth_modal', {
                detail: { view, portal },
              }),
            )
          }

          dispatchAgentUiAction({
            type: 'ui_action',
            portal,
            action: data.ui_action.action,
            target: data.ui_action.target || undefined,
            label: data.ui_action.label || undefined,
            details: data.ui_action.details || undefined,
            selector: data.ui_action.selector || undefined,
          })
          if (data.ui_action.selector) {
            highlightElement(data.ui_action.selector)
          }
        }

        dispatch(
          appendChatMessage({
            id: createSequentialId('ast'),
            sender: 'assistant',
            text: data.reply,
            time: formatClockTime(),
            recommendations: recommendations.length > 0 ? recommendations : undefined,
            organizations: organizations.length > 0 ? organizations : undefined,
            confirmedBooking,
            navigation: data.navigation,
            uiAction: data.ui_action,
          }),
        )
      } catch (err) {
        const status = (err as { status?: number })?.status
        const fallback =
          status === 401
            ? support
              ? 'Sign in to chat with the help assistant.'
              : 'Sign in to chat with the AI concierge grounded in live salon data.'
            : "I couldn't reach the assistant just now. Try again in a moment."
        setError(fallback)
        dispatch(
          appendChatMessage({
            id: createSequentialId('ast'),
            sender: 'assistant',
            text: fallback,
            time: formatClockTime(),
          }),
        )
      } finally {
        setIsThinking(false)
      }
    },
    [clientConciergeChat, prompt, messages, location, dispatch, router, portal, support],
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
