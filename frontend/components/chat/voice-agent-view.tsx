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
import {
  AlertCircle,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  Send,
  Sparkles,
  Volume2,
} from 'lucide-react'
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
  initializing: 'Securing room & waking neural models…',
  listening: 'Listening — speak or type',
  thinking: 'Synthesizing response…',
  speaking: 'Concierge speaking…',
  idle: 'Ready — speak or type below',
  disconnected: 'Session concluded',
  error: 'Voice service unavailable',
  typePlaceholder: 'Type email or appointment details…',
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
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B0F17] to-amber-950 shadow-[0_4px_16px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.15)] border border-slate-800">
            <Volume2 className="h-7 w-7 text-amber-300 animate-pulse" />
          </div>
          <p className="font-bold text-base text-slate-900 tracking-tight">
            {STATUS_TEXT.connecting}
          </p>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-400 font-mono">
            {STATUS_TEXT.initializing}
          </p>
        </div>
      </VoiceShell>
    )
  }

  if (error) {
    return (
      <VoiceShell className={className}>
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 sm:p-7 text-center shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 shadow-xs">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 tracking-tight">{STATUS_TEXT.error}</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{error}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void startVoiceSession()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-4.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-stone-800 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try again</span>
            </button>
            {onSwitchToText && (
              <button
                type="button"
                onClick={onSwitchToText}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white px-4.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                <span>Switch to chat</span>
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
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 sm:p-7 text-center shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200/70 shadow-xs">
            <PhoneOff className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 tracking-tight">
            {STATUS_TEXT.disconnected}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Thank you for consulting SalonDesk. Start a new live voice call anytime or continue in
            text chat.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void startVoiceSession()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-4.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-stone-800 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>New call</span>
            </button>
            {onSwitchToText ? (
              <button
                type="button"
                onClick={onSwitchToText}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white px-4.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                <span>Text chat</span>
              </button>
            ) : onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white px-4.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                <span>Close</span>
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
  const isSpeaking = state === 'speaking'
  const isListening = state === 'listening'
  const isThinking = state === 'thinking'

  const statusLabel =
    connectionState === ConnectionState.Connecting
      ? STATUS_TEXT.connecting
      : micBlocked
        ? 'Microphone access needed'
        : isListening
          ? STATUS_TEXT.listening
          : isThinking
            ? STATUS_TEXT.thinking
            : isSpeaking
              ? STATUS_TEXT.speaking
              : STATUS_TEXT.idle

  return (
    <div className="flex flex-1 flex-col items-center justify-between overflow-y-auto bg-gradient-to-b from-[#FAFAFA] via-white to-amber-50/20 px-4 py-5 text-slate-900 sm:px-6">
      {/* Top Status Pill with Live Kinetic Indicator */}
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

      {/* Center 2026 Voice Visualizer Acoustic Sphere */}
      <div className="my-auto py-2">
        <VoiceVisualizerOrb state={micBlocked ? 'idle' : state} />
      </div>

      {/* Transcription & Speech Content Card */}
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
          <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Live Transcription
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200/50">
                16kHz Opus
              </span>
            </div>
            <p className="text-center text-xs sm:text-sm font-medium leading-relaxed text-slate-800 min-h-10 flex items-center justify-center">
              {latestTranscript || 'Say hello, or ask for available stylists and services.'}
            </p>
          </div>
        )}
      </div>

      {/* Quick Suggestion Chips */}
      <div className="mb-3.5 flex w-full max-w-sm flex-wrap justify-center gap-1.5">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={isSending || connectionState !== ConnectionState.Connected}
            onClick={() => void handleSend(suggestion)}
            className="rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:border-amber-400 hover:bg-amber-50/60 hover:text-amber-950 disabled:opacity-50 transition-all cursor-pointer"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Fallback Text Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleSend()
        }}
        className="mb-4 flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-1 pl-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={STATUS_TEXT.typePlaceholder}
          disabled={connectionState !== ConnectionState.Connected || isSending}
          className="flex-1 bg-transparent py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isSending || connectionState !== ConnectionState.Connected}
          aria-label="Send message"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-950 text-white hover:bg-amber-600 disabled:opacity-30 shadow-xs transition-colors cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>

      {/* Floating Frosted Voice Controls Dock */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] backdrop-blur-md">
        <button
          type="button"
          onClick={() => void toggleMute()}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl shadow-xs transition-all cursor-pointer',
            !isMuted && !micBlocked
              ? 'bg-stone-950 text-white hover:bg-stone-800 border border-slate-800'
              : 'bg-rose-500 text-white hover:bg-rose-600 ring-2 ring-rose-200',
          )}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {!isMuted && !micBlocked ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        <button
          type="button"
          onClick={onEndCall}
          aria-label="End call"
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-xs hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
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

function VoiceShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-[#FAFAFA] via-white to-amber-50/20 px-6 py-8',
        className,
      )}
    >
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
