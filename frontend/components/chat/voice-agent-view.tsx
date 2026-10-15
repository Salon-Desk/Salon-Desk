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
import { AlertCircle, Loader2, Mic, MicOff, PhoneOff, RefreshCw, Send, Volume2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { VoiceVisualizerOrb } from '@/components/chat/voice-visualizer-orb'
import type { AgentLanguage } from '@/lib/features'
import { getLiveKitToken, type LiveKitTokenData } from '@/lib/livekit'
import { cn } from '@/lib/utils'

interface VoiceAgentViewProps {
  language?: AgentLanguage
  onClose?: () => void
  onSwitchToText?: () => void
  className?: string
}

const SUGGESTIONS = ['Book a Precision Fade', 'What is the hold policy?', 'Goodbye'] as const

const STATUS_TEXT = {
  connecting: 'Connecting to voice concierge…',
  initializing: 'Securing room and waking voice models…',
  listening: 'Listening — speak or type',
  thinking: 'Thinking…',
  speaking: 'Concierge speaking…',
  idle: 'Ready — speak or type',
  disconnected: 'Call ended',
  error: 'Could not connect to voice service',
  typePlaceholder: 'Type email or booking request…',
} as const

export function VoiceAgentView({
  language = 'en',
  onClose,
  onSwitchToText,
  className,
}: VoiceAgentViewProps) {
  const [tokenData, setTokenData] = useState<LiveKitTokenData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ended, setEnded] = useState(false)
  const closingRef = useRef(false)
  const sessionConnectedRef = useRef(false)

  const startVoiceSession = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setEnded(false)
    closingRef.current = false
    sessionConnectedRef.current = false

    try {
      const data = await getLiveKitToken({
        roomName: `salondesk-agent-${language}-${crypto.randomUUID().slice(0, 6)}`,
        language,
        metadata: {
          language,
          app: 'salondesk',
          mode: 'voice',
        },
      })
      setTokenData(data)
    } catch (err: unknown) {
      console.error('Failed to acquire LiveKit token:', err)
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 503) {
        setError('Voice agent is unavailable. LiveKit is not configured on the server.')
      } else {
        setError(
          (err as { message?: string })?.message ||
            'Could not initialize voice session. Make sure the backend voice service is running.',
        )
      }
    } finally {
      setIsLoading(false)
    }
  }, [language])

  useEffect(() => {
    void startVoiceSession()
  }, [startVoiceSession])

  const closeAndLeaveVoice = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setTokenData(null)
    setEnded(true)
  }, [])

  const handleEndCall = useCallback(() => {
    closeAndLeaveVoice()
  }, [closeAndLeaveVoice])

  const handleAgentEnded = useCallback(() => {
    closeAndLeaveVoice()
  }, [closeAndLeaveVoice])

  const handleRoomConnected = useCallback(() => {
    sessionConnectedRef.current = true
  }, [])

  const handleRoomDisconnected = useCallback(() => {
    if (!sessionConnectedRef.current || closingRef.current) return
    closeAndLeaveVoice()
  }, [closeAndLeaveVoice])

  if (isLoading) {
    return (
      <VoiceShell className={className}>
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-stone-900 to-amber-900 shadow-lg">
            <Volume2 className="h-7 w-7 text-amber-200 animate-pulse" />
          </div>
          <p className="font-serif text-base text-stone-900">{STATUS_TEXT.connecting}</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-stone-500">
            {STATUS_TEXT.initializing}
          </p>
        </div>
      </VoiceShell>
    )
  }

  if (error) {
    return (
      <VoiceShell className={className}>
        <div className="rounded-3xl border border-stone-200/80 bg-white px-6 py-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-base text-stone-950">{STATUS_TEXT.error}</h3>
          <p className="mt-2 text-xs leading-relaxed text-stone-600">{error}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void startVoiceSession()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
            {onSwitchToText && (
              <button
                type="button"
                onClick={onSwitchToText}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-50 cursor-pointer"
              >
                Switch to chat
              </button>
            )}
          </div>
        </div>
      </VoiceShell>
    )
  }

  if (ended || !tokenData) {
    return (
      <VoiceShell className={className}>
        <div className="rounded-3xl border border-stone-200/80 bg-white px-6 py-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-600">
            <PhoneOff className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-base text-stone-950">{STATUS_TEXT.disconnected}</h3>
          <p className="mt-2 text-xs leading-relaxed text-stone-600">
            Thanks for chatting. Start a new call anytime or continue in text.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void startVoiceSession()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              New call
            </button>
            {onSwitchToText ? (
              <button
                type="button"
                onClick={onSwitchToText}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-50 cursor-pointer"
              >
                Text chat
              </button>
            ) : onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-50 cursor-pointer"
              >
                Close
              </button>
            ) : null}
          </div>
        </div>
      </VoiceShell>
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
        onConnected={handleRoomConnected}
        onDisconnected={handleRoomDisconnected}
        className="flex flex-1 flex-col"
      >
        <RoomAudioRenderer />
        <InnerVoiceAssistantUI
          language={language}
          onEndCall={handleEndCall}
          onAgentEnded={handleAgentEnded}
        />
      </LiveKitRoom>
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
    if (!localParticipant) return
    setEnablingMic(true)
    try {
      try {
        void localParticipant.setAttributes({ language, lang: language })
      } catch {
        /* best-effort */
      }
      await localParticipant.setMicrophoneEnabled(true)
      setMicBlocked(false)
      setIsMuted(false)
    } catch (err) {
      console.warn('Microphone permission or enable failed:', err)
      setMicBlocked(true)
    } finally {
      setEnablingMic(false)
    }
  }, [localParticipant, language])

  useEffect(() => {
    if (localParticipant) {
      void enableMic()
    }
  }, [localParticipant, enableMic])

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
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload)) as { type?: string }
        if (msg?.type === 'call_ended') finishFromAgent()
      } catch {
        /* ignore */
      }
    }

    const onParticipantDisconnected = (participant: RemoteParticipant) => {
      const identity = (participant.identity || '').toLowerCase()
      const name = (participant.name || '').toLowerCase()
      if (identity.includes('agent') || name.includes('agent')) {
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
  const statusLabel =
    connectionState === ConnectionState.Connecting
      ? STATUS_TEXT.connecting
      : micBlocked
        ? 'Microphone access needed'
        : state === 'listening'
          ? STATUS_TEXT.listening
          : state === 'thinking'
            ? STATUS_TEXT.thinking
            : state === 'speaking'
              ? STATUS_TEXT.speaking
              : STATUS_TEXT.idle

  return (
    <div className="flex flex-1 flex-col items-center justify-between overflow-y-auto bg-gradient-to-b from-[#faf9f7] via-white to-amber-50/20 px-5 py-5 text-stone-900">
      <div className="pt-1 text-center">
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all ring-1 ring-inset',
            micBlocked && 'bg-rose-50 text-rose-800 ring-rose-200/80',
            !micBlocked &&
              state === 'listening' &&
              'bg-rose-50 text-rose-700 ring-rose-200/60 animate-pulse',
            !micBlocked &&
              state === 'speaking' &&
              'bg-amber-50 text-amber-900 ring-amber-200/60 animate-pulse',
            !micBlocked &&
              state === 'thinking' &&
              'bg-stone-100 text-stone-700 ring-stone-200/80 animate-pulse',
            !micBlocked &&
              !['listening', 'speaking', 'thinking'].includes(state) &&
              'bg-stone-100 text-stone-600 ring-stone-200/60',
          )}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          {statusLabel}
        </span>
      </div>

      <VoiceVisualizerOrb state={micBlocked ? 'idle' : state} className="my-2" />

      <div className="mb-3 min-h-14 w-full max-w-sm px-1">
        {micBlocked ? (
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-center">
            <p className="text-xs leading-relaxed text-rose-800">
              Microphone access was denied. You can still type below or enable your mic.
            </p>
            <button
              type="button"
              disabled={enablingMic}
              onClick={() => void enableMic()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-700 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-800 disabled:opacity-60 cursor-pointer"
            >
              {enablingMic ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Mic className="h-3 w-3" />
              )}
              Enable microphone
            </button>
          </div>
        ) : (
          <p className="text-center text-xs leading-relaxed text-stone-600">
            {latestTranscript || 'Say hello, or type an email / booking request below.'}
          </p>
        )}
      </div>

      <div className="mb-4 flex w-full max-w-sm flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={isSending || connectionState !== ConnectionState.Connected}
            onClick={() => void handleSend(suggestion)}
            className="rounded-full border border-stone-200/80 bg-white px-3 py-1.5 text-xs text-stone-800 shadow-xs hover:border-amber-200 hover:bg-amber-50/50 disabled:opacity-50 cursor-pointer"
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
        className="mb-4 flex w-full max-w-sm items-center gap-2 rounded-full border border-stone-200/80 bg-white p-1 pl-4 shadow-sm"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={STATUS_TEXT.typePlaceholder}
          disabled={connectionState !== ConnectionState.Connected || isSending}
          className="flex-1 bg-transparent py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSending || connectionState !== ConnectionState.Connected}
          aria-label="Send message"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-950 text-white hover:bg-amber-700 disabled:opacity-30 cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>

      <div className="mb-2 flex items-center gap-4">
        <button
          type="button"
          onClick={() => void toggleMute()}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-all cursor-pointer',
            !isMuted && !micBlocked
              ? 'bg-stone-950 text-white hover:bg-stone-800'
              : 'bg-rose-500 text-white hover:bg-rose-600 ring-4 ring-rose-100',
          )}
        >
          {!isMuted && !micBlocked ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={onEndCall}
          aria-label="End call"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-800 shadow-sm hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
      <p className="text-[11px] text-stone-400">You can still type if the mic is muted</p>
    </div>
  )
}

function VoiceShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-[#faf9f7] via-white to-amber-50/25 px-6 py-8',
        className,
      )}
    >
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
