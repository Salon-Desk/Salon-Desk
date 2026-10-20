'use client'

import {
  useChat,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react'
import { ConnectionState, type RemoteParticipant, RoomEvent } from 'livekit-client'
import {
  Building2,
  CalendarCheck,
  Clock,
  Loader2,
  MapPin,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'

import { FloatingVoicePill } from '@/components/chat/FloatingVoicePill'
import type {
  AgentOrganizationRecommendation,
  AgentServiceRecommendation,
} from '@/components/chat/useAgentChat'
import { VoiceVisualizerOrb } from '@/components/chat/VoiceVisualizerOrb'
import { toastColor } from '@/constant/toast-color'
import { VOICE_AGENT_STATUS } from '@/constant/voice-agent'
import { dispatchAgentUiAction, highlightElement } from '@/hooks/useAgentUiActions'
import { type AssistantPortal, isSupportPortal, portalChrome } from '@/lib/assistant-portal'
import { SERVICE_IMAGE_FALLBACK } from '@/lib/data/service-content'
import type { AgentLanguage } from '@/lib/features'
import type { GeoCoords } from '@/lib/util/geo'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import {
  isAgentGoodbyeTranscript,
  isAgentParticipant,
  parseAgentControlPayload,
} from '@/lib/util/voice-agent'
import { cn } from '@/lib/utils'
import { setAuthData } from '@/store/authSlice'

export interface InnerVoiceAssistantUIProps {
  language: AgentLanguage
  portal?: AssistantPortal
  location?: GeoCoords | null
  locationError: string | null
  onEndCall: () => void
  onAgentEnded: () => void
  clearLocationError: () => void
  onStartVoiceSession: () => void
  onSetLocation?: (coords: GeoCoords) => void
  isMinimized?: boolean
  onMinimizeChange?: (minimized: boolean) => void
}

export function InnerVoiceAssistantUI({
  language,
  portal = 'client',
  location,
  locationError,
  onEndCall,
  onAgentEnded,
  clearLocationError,
  onStartVoiceSession,
  onSetLocation,
  isMinimized,
  onMinimizeChange,
}: InnerVoiceAssistantUIProps) {
  const dispatch = useDispatch()
  const router = useRouter()
  const chrome = portalChrome(portal)
  const support = isSupportPortal(portal)
  const { state, agentTranscriptions } = useVoiceAssistant()
  const connectionState = useConnectionState()
  const { localParticipant } = useLocalParticipant()
  const { send: sendChat, isSending } = useChat()
  const room = useRoomContext()
  const [isMuted, setIsMuted] = useState(true)
  const [micBlocked, setMicBlocked] = useState(false)
  const [draft, setDraft] = useState('')
  const [enablingMic, setEnablingMic] = useState(false)
  const [discoveredOrgs, setDiscoveredOrgs] = useState<AgentOrganizationRecommendation[]>([])
  const [discoveredServices, setDiscoveredServices] = useState<AgentServiceRecommendation[]>([])
  const endedByAgentRef = useRef(false)
  const hasConnectedRef = useRef(false)

  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      hasConnectedRef.current = true
    }
  }, [connectionState])

  // Initial connection: start muted by default as requested
  useEffect(() => {
    if (localParticipant && connectionState === ConnectionState.Connected) {
      localParticipant.setAttributes({ language, lang: language }).catch(() => {
        /* best-effort */
      })
      localParticipant.setMicrophoneEnabled(false).catch(() => {
        /* best-effort */
      })
      setIsMuted(true)
    }
  }, [localParticipant, connectionState, language])

  useEffect(() => {
    if (!localParticipant || !location || connectionState !== ConnectionState.Connected) return

    localParticipant
      .setAttributes({
        language,
        lang: language,
        lat: String(location.lat),
        lng: String(location.lng),
      })
      .catch(() => {
        /* best-effort */
      })

    if (room && connectionState === ConnectionState.Connected) {
      const payload = JSON.stringify({
        type: 'user_location',
        lat: location.lat,
        lng: location.lng,
      })
      const encoder = new TextEncoder()
      localParticipant
        .publishData(encoder.encode(payload), {
          reliable: true,
          topic: 'lk.client.location',
        })
        .catch(() => {
          /* best-effort */
        })
    }
  }, [localParticipant, room, language, location, connectionState])

  useEffect(() => {
    if (!room) return

    const finishFromAgent = () => {
      if (!hasConnectedRef.current || endedByAgentRef.current) return
      endedByAgentRef.current = true
      onAgentEnded()
    }

    const onData = (
      payload: Uint8Array,
      _participant?: RemoteParticipant,
      _kind?: unknown,
      topic?: string,
    ) => {
      try {
        const text = new TextDecoder().decode(payload)
        const parsed = JSON.parse(text)

        if (parsed?.type === 'auth_success' && parsed?.access_token && parsed?.user) {
          dispatch(
            setAuthData({
              user: parsed.user,
              access_token: parsed.access_token,
              portal: 'client',
            }),
          )
          const name = parsed.user.first_name || parsed.user.email
          toast.success(`Logged in as ${name}`, toastColor.success)
          return
        }

        if (parsed?.type === 'booking_confirmed') {
          toast.success(
            `Appointment for ${parsed.service_name || 'Service'} confirmed! $0 PayPal hold active.`,
            toastColor.success,
          )
          return
        }

        if (parsed?.type === 'nearby_organizations' && Array.isArray(parsed?.organizations)) {
          const orgs: AgentOrganizationRecommendation[] = parsed.organizations.map(
            (o: Record<string, unknown>) => ({
              id: String(o.id),
              name: String(o.name || ''),
              description: o.description ? String(o.description) : null,
              picture: o.picture ? String(o.picture) : null,
              physicalAddress: o.physical_address ? String(o.physical_address) : null,
              rating: Number(o.rating || 4.9),
              distanceKm: typeof o.distance_km === 'number' ? o.distance_km : null,
            }),
          )
          setDiscoveredOrgs(orgs)
          return
        }

        if (parsed?.type === 'catalog_results') {
          if (Array.isArray(parsed?.organizations) && parsed.organizations.length > 0) {
            const orgs: AgentOrganizationRecommendation[] = parsed.organizations.map(
              (o: Record<string, unknown>) => ({
                id: String(o.id),
                name: String(o.name || ''),
                description: o.description ? String(o.description) : null,
                picture: o.picture ? String(o.picture) : null,
                physicalAddress: o.physical_address ? String(o.physical_address) : null,
                rating: Number(o.rating || 4.9),
                distanceKm: typeof o.distance_km === 'number' ? o.distance_km : null,
              }),
            )
            setDiscoveredOrgs(orgs)
          }
          if (Array.isArray(parsed?.recommendations) && parsed.recommendations.length > 0) {
            const srvs: AgentServiceRecommendation[] = parsed.recommendations.map(
              (r: Record<string, unknown>) => ({
                serviceId: String(r.service_id),
                organizationId: String(r.organization_id),
                name: String(r.name || ''),
                organizationName: String(r.organization_name || 'Salon'),
                organizationPicture: r.organization_picture ? String(r.organization_picture) : null,
                imageUrl: r.image_url ? String(r.image_url) : null,
                basePrice: Number(r.base_price || 0),
                durationMinutes: Number(r.duration_minutes || 45),
                categoryName: r.category_name ? String(r.category_name) : null,
                physicalAddress: r.physical_address ? String(r.physical_address) : null,
                distanceKm: typeof r.distance_km === 'number' ? r.distance_km : null,
              }),
            )
            setDiscoveredServices(srvs)
          }
          return
        }

        if (parsed?.type === 'navigate' && parsed?.target) {
          router.push(parsed.target)
          dispatchAgentUiAction(parsed)
          if (parsed.selector) {
            highlightElement(parsed.selector)
          }
          return
        }

        if (parsed?.type === 'ui_action') {
          if (
            parsed.target &&
            typeof window !== 'undefined' &&
            window.location.pathname !== parsed.target
          ) {
            router.push(parsed.target)
          }
          dispatchAgentUiAction(parsed)
          if (parsed.selector) {
            highlightElement(parsed.selector)
          }
          return
        }
      } catch {
        /* non-json payload */
      }

      if (topic && topic !== 'lk.agent.control') return
      const msg = parseAgentControlPayload(payload)
      if (msg?.type === 'call_ended') finishFromAgent()
    }

    const onParticipantDisconnected = (participant: RemoteParticipant) => {
      if (isAgentParticipant(participant.identity || '', participant.name || '')) {
        finishFromAgent()
      }
    }

    const onDisconnected = () => {
      finishFromAgent()
    }

    room.on(RoomEvent.DataReceived, onData)
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
    room.on(RoomEvent.Disconnected, onDisconnected)
    return () => {
      room.off(RoomEvent.DataReceived, onData)
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
      room.off(RoomEvent.Disconnected, onDisconnected)
    }
  }, [room, onAgentEnded, dispatch, router])

  useEffect(() => {
    const lastTranscript = agentTranscriptions.at(-1)?.text
    if (
      isAgentGoodbyeTranscript(lastTranscript) &&
      !endedByAgentRef.current &&
      hasConnectedRef.current
    ) {
      endedByAgentRef.current = true
      onEndCall()
    }
  }, [agentTranscriptions, onEndCall])

  const enableMic = useCallback(async () => {
    if (!localParticipant) return
    try {
      setEnablingMic(true)
      await localParticipant.setAttributes({ language, lang: language }).catch(() => {})
      await localParticipant.setMicrophoneEnabled(true)
      setMicBlocked(false)
      setIsMuted(false)
    } catch (err) {
      console.error('Failed to enable microphone:', err)
      setMicBlocked(true)
    } finally {
      setEnablingMic(false)
    }
  }, [localParticipant, language])

  const toggleMute = useCallback(async () => {
    if (!localParticipant) return
    if (isMuted) {
      await enableMic()
    } else {
      try {
        await localParticipant.setMicrophoneEnabled(false)
        setIsMuted(true)
      } catch (err) {
        console.error('Failed to mute microphone:', err)
      }
    }
  }, [localParticipant, isMuted, enableMic])

  const handleSend = useCallback(
    async (text?: string) => {
      const value = (text ?? draft).trim()
      if (!value || isSending || connectionState !== ConnectionState.Connected) return
      try {
        await sendChat(value)
        setDraft('')
      } catch (err) {
        console.error('Failed to send typed voice message:', err)
      }
    },
    [sendChat, isSending, connectionState, draft],
  )

  const latestTranscript = agentTranscriptions.at(-1)?.text
  const isSpeaking = state === 'speaking'
  const isListening = state === 'listening'
  const isThinking = state === 'thinking'
  const visibleOrgs = support ? [] : discoveredServices.length > 0 ? [] : discoveredOrgs
  const visibleServices = support ? [] : discoveredServices
  const canShowMoreServices = !support && discoveredServices.length === 3

  if (isMinimized) {
    return (
      <FloatingVoicePill
        portal={portal}
        isMuted={isMuted}
        state={state}
        onToggleMute={() => void toggleMute()}
        onMaximize={() => onMinimizeChange?.(false)}
        onEndCall={onEndCall}
      />
    )
  }

  const statusLabel =
    connectionState === ConnectionState.Connecting
      ? chrome.voiceConnecting
      : micBlocked
        ? VOICE_AGENT_STATUS.micBlocked
        : isListening
          ? chrome.voiceListening
          : isThinking
            ? VOICE_AGENT_STATUS.thinking
            : isSpeaking
              ? VOICE_AGENT_STATUS.speaking
              : chrome.voiceIdle

  return (
    <div
      className={cn(
        'flex flex-1 flex-col justify-between overflow-hidden text-slate-900',
        chrome.voiceShellBg,
      )}
    >
      {/* Scrollable Main Stream */}
      <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-3 sm:px-5">
        {/* Status Header */}
        <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border shadow-2xs transition-all',
                micBlocked && 'bg-rose-50 text-rose-800 border-rose-300/70',
                !micBlocked && isListening && 'bg-rose-50 text-rose-800 border-rose-300/80',
                !micBlocked && isSpeaking && 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
                !micBlocked && isThinking && 'bg-amber-50 text-amber-900 border-amber-300/80',
                !micBlocked &&
                  !['listening', 'speaking', 'thinking'].includes(state) &&
                  'bg-slate-100 text-slate-700 border-slate-200/80',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  micBlocked && 'bg-rose-500',
                  !micBlocked && isListening && 'bg-rose-500 animate-pulse',
                  !micBlocked && isSpeaking && 'bg-emerald-500 animate-pulse',
                  !micBlocked && isThinking && 'bg-amber-500 animate-pulse',
                  !micBlocked &&
                    !['listening', 'speaking', 'thinking'].includes(state) &&
                    'bg-slate-400',
                )}
              />
              <span className="font-mono text-[10px] tracking-tight">{statusLabel}</span>
            </span>

            {location && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 bg-emerald-50/90 px-2 py-0.5 text-[10px] font-medium text-emerald-800 shadow-2xs">
                <MapPin className="h-2.5 w-2.5 text-emerald-600" />
                <span>
                  GPS Active ({location.lat.toFixed(2)}, {location.lng.toFixed(2)})
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Centered Voice Visualizer Orb */}
        <div className="flex w-full items-center justify-center py-1">
          <VoiceVisualizerOrb size="sm" state={micBlocked ? 'idle' : state} />
        </div>

        {/* Location Error Notice */}
        {!support && locationError && !location && (
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/90 p-2.5 text-center shadow-2xs">
            <p className="text-[11px] leading-snug text-amber-800">{locationError}</p>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-1 rounded bg-amber-700 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-amber-800"
                onClick={() => {
                  clearLocationError()
                  void onStartVoiceSession()
                }}
              >
                Retry GPS
              </button>
              {onSetLocation && (
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-1 rounded border border-amber-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-900 shadow-2xs hover:bg-amber-100"
                  onClick={() => {
                    clearLocationError()
                    onSetLocation({ lat: 8.9806, lng: 38.7578 })
                  }}
                >
                  Use Addis Ababa (Bole)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mic Blocked Alert */}
        {micBlocked && (
          <div className="rounded-xl border border-rose-200/80 bg-rose-50/90 p-3 text-center shadow-xs">
            <p className="text-xs leading-relaxed text-rose-800">
              Microphone access is blocked. You can still type below or enable your mic.
            </p>
            <button
              type="button"
              disabled={enablingMic}
              onClick={() => void enableMic()}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-rose-800 disabled:opacity-60 cursor-pointer"
            >
              {enablingMic ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Mic className="h-3 w-3" />
              )}
              <span>Enable microphone</span>
            </button>
          </div>
        )}

        {/* Live Transcription Box */}
        <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] backdrop-blur-sm">
          <div className="mb-1.5 flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <Sparkles
                className={cn(
                  'h-3 w-3',
                  portal === 'merchant' && 'text-teal-500',
                  portal === 'admin' && 'text-sky-500',
                  portal === 'client' && 'text-amber-500',
                )}
              />
              {support ? `${chrome.title} Voice` : 'Agent Voice Stream'}
            </span>
            <span className="rounded-md border border-emerald-200/50 bg-emerald-50 px-1.5 py-0.2 text-[10px] font-mono font-semibold text-emerald-600">
              16kHz Opus
            </span>
          </div>
          <p className="text-xs sm:text-sm font-normal leading-relaxed text-slate-800 whitespace-pre-wrap">
            {latestTranscript ||
              (support
                ? 'Say hi, or ask how to use a part of the console.'
                : 'Say hi, or tell me what you are hoping to book.')}
          </p>
        </div>

        {/* Real Discovered Salons / Organizations Cards (When present) */}
        {visibleOrgs.length > 0 && (
          <div className="space-y-2 pt-1 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-amber-600" />
                Discovered Salons
              </span>
              <span className="font-mono text-emerald-700 lowercase">$0 hold guarantee</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {visibleOrgs.map((org) => (
                <div
                  key={org.id}
                  className="group relative flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] hover:border-amber-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-amber-50 flex items-center justify-center">
                      {org.picture ? (
                        <Image
                          src={org.picture}
                          alt={org.name}
                          fill
                          unoptimized={shouldUnoptimizeImage(org.picture)}
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-amber-700" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="truncate font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-900 transition-colors">
                          {org.name}
                        </h4>
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="flex items-center text-amber-700 font-medium">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500 mr-0.5" />
                          {org.rating || 4.9}
                        </span>
                        {org.physicalAddress && (
                          <span className="truncate max-w-[130px] flex items-center">
                            <MapPin className="h-3 w-3 mr-0.5 shrink-0" />
                            {org.physicalAddress}
                          </span>
                        )}
                        {org.distanceKm !== null && org.distanceKm !== undefined && (
                          <span className="font-mono text-amber-800 font-semibold">
                            · {org.distanceKm} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSend(`Show services for ${org.name}`)}
                    className="shrink-0 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/70 px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real Discovered Services Cards (When present) */}
        {visibleServices.length > 0 && (
          <div className="space-y-2 pt-1 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                Available Services
              </span>
              <span className="text-emerald-700 font-mono lowercase">$0 hold today</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {visibleServices.map((rec) => (
                <div
                  key={rec.serviceId}
                  onClick={() => void handleSend(`Book ${rec.name} at ${rec.organizationName}`)}
                  className="group relative rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-3 text-slate-900 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100">
                      <Image
                        src={rec.imageUrl || rec.organizationPicture || SERVICE_IMAGE_FALLBACK}
                        alt={rec.name}
                        fill
                        unoptimized={shouldUnoptimizeImage(
                          rec.imageUrl || rec.organizationPicture || SERVICE_IMAGE_FALLBACK,
                        )}
                        sizes="56px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                            {rec.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {rec.organizationName}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono tabular-nums font-extrabold text-xs sm:text-sm text-amber-950">
                            ${rec.basePrice}
                          </span>
                          <span className="block text-[10px] text-emerald-700 font-medium">
                            $0 hold
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-amber-100">
                        <div className="flex items-center gap-2">
                          {rec.durationMinutes && (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                              <Clock className="h-3 w-3 text-amber-600" />
                              {rec.durationMinutes} min
                            </span>
                          )}
                          {rec.distanceKm !== null && rec.distanceKm !== undefined && (
                            <span className="flex items-center gap-0.5 font-mono text-[10px] text-amber-800">
                              <MapPin className="h-3 w-3 text-amber-600" />
                              {rec.distanceKm} km
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleSend(`Book ${rec.name} at ${rec.organizationName}`)
                          }}
                          className="flex items-center gap-1 rounded-lg bg-stone-950 hover:bg-amber-600 text-white px-2 py-0.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <CalendarCheck className="h-3 w-3" />
                          <span>Select &amp; Book</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {canShowMoreServices && (
              <button
                type="button"
                disabled={isSending || connectionState !== ConnectionState.Connected}
                onClick={() => void handleSend('Show me a few more options')}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-amber-300 hover:bg-amber-50/60 cursor-pointer disabled:opacity-40"
              >
                Show a few more
              </button>
            )}
          </div>
        )}
      </div>

      {/* Control Bottom Section */}
      <div className="border-t border-slate-200/80 bg-white/95 p-3 sm:p-4 backdrop-blur-md">
        {/* Quick Suggestion Pills */}
        <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {chrome.voiceSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={isSending || connectionState !== ConnectionState.Connected}
              onClick={() => void handleSend(suggestion)}
              className={cn(
                'shrink-0 cursor-pointer rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-2xs transition-all disabled:opacity-50',
                chrome.chipHover,
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Action Dock */}
        <div className="flex items-center gap-2">
          {/* Microphone Mute Toggle */}
          <button
            type="button"
            onClick={() => void toggleMute()}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={cn(
              'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl shadow-xs transition-all',
              !isMuted && !micBlocked
                ? 'border border-slate-800 bg-stone-950 text-white hover:bg-stone-800 ring-2 ring-emerald-400/20'
                : 'bg-rose-500 text-white ring-2 ring-rose-200 hover:bg-rose-600',
            )}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {!isMuted && !micBlocked ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>

          {/* Text Input with Send */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleSend()
            }}
            className={cn(
              'flex flex-1 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1 pl-3 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] transition-all focus-within:bg-white focus-within:ring-2',
              chrome.focusWithin,
            )}
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={chrome.voicePlaceholder}
              disabled={connectionState !== ConnectionState.Connected || isSending}
              className="flex-1 bg-transparent py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSending || connectionState !== ConnectionState.Connected}
              aria-label="Send message"
              className={cn(
                'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white shadow-xs transition-colors disabled:opacity-30',
                support ? chrome.sendReady : 'bg-stone-950 hover:bg-amber-600',
              )}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* End Call Button */}
          <button
            type="button"
            onClick={onEndCall}
            aria-label="End call"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-rose-200 bg-rose-50/80 text-rose-700 shadow-xs transition-all hover:border-rose-400 hover:bg-rose-100"
            title="End session"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-center text-[10px] font-mono text-slate-400">
          Speak naturally or type anytime · $0 authorization hold
        </p>
      </div>
    </div>
  )
}
