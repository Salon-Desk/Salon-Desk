'use client'

import '@livekit/components-styles'

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useChat,
  useConnectionState,
  useLocalParticipant,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react'
import { ConnectionState, type RemoteParticipant, RoomEvent } from 'livekit-client'
import { Loader2, Mic, MicOff, PhoneOff, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { VoiceVisualizerOrb } from '@/components/chat/voice-visualizer-orb'
import type { AgentLanguage } from '@/lib/features'
import { getLiveKitToken, type LiveKitTokenData } from '@/lib/livekit'
import { cn } from '@/lib/utils'

const CONTROL_TOPIC = 'lk.agent.control'
const SUGGESTIONS = ['Book a Precision Fade', 'What is the hold policy?', 'Goodbye'] as const

interface VoiceAgentViewProps {
  language?: AgentLanguage
  onClose: () => void
  onSwitchToText?: () => void
  className?: string
}

type SessionPhase = 'loading' | 'ready' | 'ended' | 'error'

export function VoiceAgentView({
  language = 'en',
  onClose,
  onSwitchToText,
  className,
}: VoiceAgentViewProps) {
  const [tokenData, setTokenData] = useState<LiveKitTokenData | null>(null)
  const [phase, setPhase] = useState<SessionPhase>('loading')
  const [error, setError] = useState<string | null>(null)
  const [sessionKey, setSessionKey] = useState(0)
  const sessionConnectedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function startSession() {
      setPhase('loading')
      setError(null)
      setTokenData(null)
      sessionConnectedRef.current = false

      try {
        const data = await getLiveKitToken({
          language,
          metadata: {
            language,
            app: 'salondesk',
            mode: 'voice',
          },
        })
        if (cancelled) return
        setTokenData(data)
        setPhase('ready')
      } catch (err) {
        if (cancelled) return
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 401) {
          setError('Sign in to start a voice session with the AI concierge.')
        } else if (status === 503) {
          setError('Voice agent is unavailable. LiveKit may not be configured on the server.')
        } else {
          setError('Could not connect to the voice agent. Please try again.')
        }
        setPhase('error')
      }
    }

    void startSession()
    return () => {
      cancelled = true
    }
  }, [language, sessionKey])

  const handleEndCall = () => {
    setTokenData(null)
    setPhase('ended')
  }

  const handleRoomDisconnected = () => {
    if (!sessionConnectedRef.current) return
    setTokenData(null)
    setPhase('ended')
  }

  const handleRetry = () => setSessionKey((k) => k + 1)

  if (phase === 'loading') {
    return (
      <VoiceStatusPanel className={className}>
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <p className="mt-3 text-sm text-stone-600">Connecting to voice agent…</p>
      </VoiceStatusPanel>
    )
  }

  if (phase === 'error') {
    return (
      <VoiceStatusPanel className={className}>
        <p className="max-w-xs text-center text-sm text-stone-700">{error}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-full bg-stone-950 px-4 py-2 text-xs font-medium text-white hover:bg-amber-600 cursor-pointer"
          >
            Retry
          </button>
          {onSwitchToText && (
            <button
              type="button"
              onClick={onSwitchToText}
              className="rounded-full bg-stone-100 px-4 py-2 text-xs font-medium text-stone-800 hover:bg-stone-200 cursor-pointer"
            >
              Switch to chat
            </button>
          )}
        </div>
      </VoiceStatusPanel>
    )
  }

  if (phase === 'ended' || !tokenData) {
    return (
      <VoiceStatusPanel className={className}>
        <p className="text-sm font-medium text-stone-800">Call ended</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-full bg-stone-950 px-4 py-2 text-xs font-medium text-white hover:bg-amber-600 cursor-pointer"
          >
            New call
          </button>
          {onSwitchToText ? (
            <button
              type="button"
              onClick={onSwitchToText}
              className="rounded-full bg-stone-100 px-4 py-2 text-xs font-medium text-stone-800 hover:bg-stone-200 cursor-pointer"
            >
              Text chat
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-stone-100 px-4 py-2 text-xs font-medium text-stone-800 hover:bg-stone-200 cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </VoiceStatusPanel>
    )
  }

  return (
    <div className={cn('flex flex-1 flex-col overflow-hidden', className)}>
      <LiveKitRoom
        key={tokenData.roomName}
        token={tokenData.token}
        serverUrl={tokenData.serverUrl}
        connect
        audio
        video={false}
        options={{
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          },
          publishDefaults: { dtx: true, red: true },
        }}
        onConnected={() => {
          sessionConnectedRef.current = true
        }}
        onDisconnected={handleRoomDisconnected}
        className="flex flex-1 flex-col"
      >
        <RoomAudioRenderer />
        <InnerVoiceAssistantUI
          language={language}
          onEndCall={handleEndCall}
          onAgentEnded={() => {
            setTokenData(null)
            setPhase('ended')
          }}
        />
      </LiveKitRoom>
    </div>
  )
}

function VoiceStatusPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-[#fbfbfa] via-white to-amber-50/15 p-6',
        className,
      )}
    >
      {children}
    </div>
  )
}

function InnerVoiceAssistantUI({
  language,
  onEndCall,
  onAgentEnded,
}: {
  language: AgentLanguage
  onEndCall: () => void
  onAgentEnded: () => void
}) {
  const { state, agentTranscriptions } = useVoiceAssistant()
  const connectionState = useConnectionState()
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()
  const { chatMessages, send } = useChat()
  const room = useRoomContext()
  const [draft, setDraft] = useState('')
  const [micError, setMicError] = useState<string | null>(null)
  const endedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    async function enableMic() {
      try {
        await localParticipant.setMicrophoneEnabled(true)
        await localParticipant.setAttributes({ language })
      } catch {
        if (!cancelled) {
          setMicError('Microphone access is required. Allow mic permission and try again.')
        }
      }
    }
    if (connectionState === ConnectionState.Connected) {
      void enableMic()
    }
    return () => {
      cancelled = true
    }
  }, [connectionState, language, localParticipant])

  useEffect(() => {
    const finish = () => {
      if (endedRef.current) return
      endedRef.current = true
      onAgentEnded()
    }

    const onData = (
      payload: Uint8Array,
      _participant?: RemoteParticipant,
      _kind?: unknown,
      topic?: string,
    ) => {
      if (topic !== CONTROL_TOPIC) return
      try {
        const parsed = JSON.parse(new TextDecoder().decode(payload)) as { type?: string }
        if (parsed.type === 'call_ended') finish()
      } catch {
        // ignore non-JSON control payloads
      }
    }

    const onParticipantDisconnected = (participant: RemoteParticipant) => {
      const id = `${participant.identity} ${participant.name ?? ''}`.toLowerCase()
      if (id.includes('agent')) finish()
    }

    room.on(RoomEvent.DataReceived, onData)
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
    return () => {
      room.off(RoomEvent.DataReceived, onData)
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
    }
  }, [onAgentEnded, room])

  const latestTranscript = agentTranscriptions.at(-1)?.text
  const latestChat = chatMessages.at(-1)
  const statusLabel =
    connectionState === ConnectionState.Connecting
      ? 'Connecting…'
      : state === 'listening'
        ? 'Listening…'
        : state === 'thinking'
          ? 'Thinking…'
          : state === 'speaking'
            ? 'Speaking…'
            : 'Ready'

  const handleSend = async (text?: string) => {
    const value = (text ?? draft).trim()
    if (!value) return
    await send(value)
    setDraft('')
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-between overflow-y-auto bg-gradient-to-b from-[#fbfbfa] via-white to-amber-50/15 p-5 text-stone-900">
      <div className="pt-1 text-center">
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all',
            state === 'listening' && 'bg-rose-50 text-rose-700 animate-pulse',
            state === 'speaking' && 'bg-amber-50 text-amber-800 animate-pulse',
            state === 'thinking' && 'bg-stone-100 text-stone-700 animate-pulse',
            !['listening', 'speaking', 'thinking'].includes(state) && 'bg-stone-100 text-stone-600',
          )}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          {statusLabel}
        </span>
      </div>

      <VoiceVisualizerOrb state={state} className="my-4" />

      <div className="mb-3 min-h-12 w-full max-w-sm px-2 text-center">
        {micError ? (
          <p className="text-xs text-rose-600">{micError}</p>
        ) : (
          <p className="text-xs leading-relaxed text-stone-600">
            {latestTranscript ||
              latestChat?.message ||
              'Say hello, or type an email / booking request below.'}
          </p>
        )}
      </div>

      <div className="mb-4 flex w-full max-w-sm flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => void handleSend(suggestion)}
            className="rounded-full bg-stone-100 px-3 py-1.5 text-xs text-stone-800 hover:bg-stone-200 cursor-pointer"
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
        className="mb-4 flex w-full max-w-sm items-center gap-2 rounded-full bg-stone-100 p-1 pl-4"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type email or message…"
          className="flex-1 bg-transparent py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send message"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-950 text-white hover:bg-amber-600 disabled:opacity-30 cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>

      <div className="mb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
          aria-label={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-colors cursor-pointer',
            isMicrophoneEnabled
              ? 'bg-stone-950 text-white hover:bg-stone-800'
              : 'bg-rose-500 text-white hover:bg-rose-600',
          )}
        >
          {isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={onEndCall}
          aria-label="End call"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-stone-800 hover:bg-rose-100 hover:text-rose-700 cursor-pointer"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
      <p className="text-[11px] text-stone-400">Mute or end the call anytime</p>
    </div>
  )
}
