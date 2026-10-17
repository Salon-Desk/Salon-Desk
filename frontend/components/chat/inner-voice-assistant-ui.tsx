'use client'

import {
  useChat,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react'
import { ConnectionState, type RemoteParticipant, RoomEvent } from 'livekit-client'
import { Loader2, MapPin, Mic, MicOff, PhoneOff, Send, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { VoiceVisualizerOrb } from '@/components/chat/voice-visualizer-orb'
import { VOICE_AGENT_STATUS, VOICE_AGENT_SUGGESTIONS } from '@/constant/voice-agent'
import type { AgentLanguage } from '@/lib/features'
import type { GeoCoords } from '@/lib/util/geo'
import {
  isAgentGoodbyeTranscript,
  isAgentParticipant,
  parseAgentControlPayload,
} from '@/lib/util/voice-agent'
import { cn } from '@/lib/utils'

export interface InnerVoiceAssistantUIProps {
  language: AgentLanguage
  location?: GeoCoords | null
  locationError: string | null
  onEndCall: () => void
  onAgentEnded: () => void
  clearLocationError: () => void
  onStartVoiceSession: () => void
  onSetLocation?: (coords: GeoCoords) => void
}

export function InnerVoiceAssistantUI({
  language,
  location,
  locationError,
  onEndCall,
  onAgentEnded,
  clearLocationError,
  onStartVoiceSession,
  onSetLocation,
}: InnerVoiceAssistantUIProps) {
  const { state, agentTranscriptions } = useVoiceAssistant()
  const connectionState = useConnectionState()
  const { localParticipant } = useLocalParticipant()
  const { send: sendChat, isSending } = useChat()
  const room = useRoomContext()
  const [isMuted, setIsMuted] = useState(false)
  const [micBlocked, setMicBlocked] = useState(false)
  const [draft, setDraft] = useState('')
  const [enablingMic, setEnablingMic] = useState(false)
  const endedByAgentRef = useRef(false)
  const hasConnectedRef = useRef(false)

  useEffect(() => {
    if (connectionState === ConnectionState.Connected) {
      hasConnectedRef.current = true
    }
  }, [connectionState])

  const enableMic = useCallback(async () => {
    if (!localParticipant || connectionState !== ConnectionState.Connected) return
    setEnablingMic(true)
    try {
      await localParticipant.setAttributes({ language, lang: language }).catch(() => {
        /* best-effort */
      })
      await localParticipant.setMicrophoneEnabled(true)
      setMicBlocked(false)
      setIsMuted(false)
    } catch (err) {
      console.warn('Microphone permission or enable failed:', err)
      setMicBlocked(true)
    } finally {
      setEnablingMic(false)
    }
  }, [localParticipant, language, connectionState])

  useEffect(() => {
    if (localParticipant && connectionState === ConnectionState.Connected) {
      void enableMic()
    }
  }, [localParticipant, connectionState, enableMic])

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
  }, [room, onAgentEnded])

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

  const toggleMute = useCallback(async () => {
    if (!localParticipant) return
    const nextMuted = !isMuted
    try {
      await localParticipant.setMicrophoneEnabled(!nextMuted)
      setIsMuted(nextMuted)
    } catch (err) {
      console.error('Failed to toggle microphone:', err)
    }
  }, [localParticipant, isMuted])

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

  const statusLabel =
    connectionState === ConnectionState.Connecting
      ? VOICE_AGENT_STATUS.connecting
      : micBlocked
        ? VOICE_AGENT_STATUS.micBlocked
        : isListening
          ? VOICE_AGENT_STATUS.listening
          : isThinking
            ? VOICE_AGENT_STATUS.thinking
            : isSpeaking
              ? VOICE_AGENT_STATUS.speaking
              : VOICE_AGENT_STATUS.idle

  return (
    <div className="flex flex-1 flex-col items-center justify-between overflow-y-auto bg-gradient-to-b from-[#FAFAFA] via-white to-amber-50/20 px-4 py-5 text-slate-900 sm:px-6">
      <div className="pt-0.5 text-center">
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] border transition-all',
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
              'h-2 w-2 rounded-full',
              micBlocked && 'bg-rose-500',
              !micBlocked && isListening && 'bg-rose-500 animate-pulse',
              !micBlocked && isSpeaking && 'bg-emerald-500 animate-pulse',
              !micBlocked && isThinking && 'bg-amber-500 animate-pulse',
              !micBlocked &&
                !['listening', 'speaking', 'thinking'].includes(state) &&
                'bg-slate-400',
            )}
          />
          <span className="font-mono text-[11px] tracking-tight">{statusLabel}</span>
        </span>
      </div>

      <div className="my-auto py-2">
        <VoiceVisualizerOrb state={micBlocked ? 'idle' : state} />
      </div>

      <div className="mb-3 w-full max-w-sm">
        {micBlocked ? (
          <div className="rounded-xl border border-rose-200/80 bg-rose-50/90 p-4 text-center shadow-xs">
            <p className="text-xs leading-relaxed text-rose-800">
              Microphone access was denied. You can still type below or enable your mic.
            </p>
            <button
              type="button"
              disabled={enablingMic}
              onClick={() => void enableMic()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-800 disabled:opacity-60 cursor-pointer"
            >
              {enablingMic ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mic className="h-3.5 w-3.5" />
              )}
              <span>Enable microphone</span>
            </button>
          </div>
        ) : (
          <>
            {location && (
              <div className="mb-2 flex items-center justify-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/90 px-3 py-0.5 text-[11px] font-medium text-emerald-800 shadow-2xs">
                <MapPin className="h-3 w-3 text-emerald-600" />
                <span>
                  Location active ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
                </span>
              </div>
            )}
            {locationError && !location && (
              <div className="mb-2.5 rounded-lg border border-amber-200/80 bg-amber-50/90 p-2.5 text-center shadow-2xs">
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
                      Use Addis Ababa (Bole) demo
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Live Transcription
                </span>
                <span className="rounded-md border border-emerald-200/50 bg-emerald-50 px-1.5 py-0.2 text-[10px] font-mono font-semibold text-emerald-600">
                  16kHz Opus
                </span>
              </div>
              <p className="flex min-h-10 items-center justify-center text-center text-xs font-medium leading-relaxed text-slate-800 sm:text-sm">
                {latestTranscript || 'Say hello, or ask for available stylists and services.'}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="mb-3.5 flex w-full max-w-sm flex-wrap justify-center gap-1.5">
        {VOICE_AGENT_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={isSending || connectionState !== ConnectionState.Connected}
            onClick={() => void handleSend(suggestion)}
            className="cursor-pointer rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition-all hover:border-amber-400 hover:bg-amber-50/60 hover:text-amber-950 disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleSend()
        }}
        className="mb-4 flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-1 pl-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] transition-all focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={VOICE_AGENT_STATUS.typePlaceholder}
          disabled={connectionState !== ConnectionState.Connected || isSending}
          className="flex-1 bg-transparent py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSending || connectionState !== ConnectionState.Connected}
          aria-label="Send message"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-stone-950 text-white shadow-xs transition-colors hover:bg-amber-600 disabled:opacity-30"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] backdrop-blur-md">
        <button
          type="button"
          onClick={() => void toggleMute()}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={cn(
            'flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl shadow-xs transition-all',
            !isMuted && !micBlocked
              ? 'border border-slate-800 bg-stone-950 text-white hover:bg-stone-800'
              : 'bg-rose-500 text-white ring-2 ring-rose-200 hover:bg-rose-600',
          )}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {!isMuted && !micBlocked ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        <button
          type="button"
          onClick={onEndCall}
          aria-label="End call"
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-xs transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
          title="End session"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>

      <p className="mt-2 text-[10px] font-mono text-slate-400">
        You can speak naturally or type if mic is muted
      </p>
    </div>
  )
}
