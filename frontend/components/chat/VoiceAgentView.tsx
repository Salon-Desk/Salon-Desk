'use client'

import '@livekit/components-styles'

import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react'
import { AlertCircle, PhoneOff, RefreshCw, Volume2 } from 'lucide-react'
import { useCallback } from 'react'

import { InnerVoiceAssistantUI } from '@/components/chat/InnerVoiceAssistantUI'
import { VoiceAgentShell } from '@/components/chat/VoiceAgentShell'
import { VOICE_AGENT_STATUS } from '@/constant/voice-agent'
import { useVoiceAgentSession } from '@/hooks/use-voice-agent-session'
import { type AssistantPortal, isSupportPortal, portalChrome } from '@/lib/assistant-portal'
import type { AgentLanguage } from '@/lib/features'
import type { GeoCoords } from '@/lib/util/geo'
import { cn } from '@/lib/utils'

export interface VoiceAgentViewProps {
  language?: AgentLanguage
  portal?: AssistantPortal
  initialLocation?: GeoCoords | null
  onClose?: () => void
  onSwitchToText?: () => void
  isMinimized?: boolean
  onMinimizeChange?: (minimized: boolean) => void
  className?: string
}

export function VoiceAgentView({
  language = 'en',
  portal = 'client',
  initialLocation,
  onClose,
  onSwitchToText,
  isMinimized,
  onMinimizeChange,
  className,
}: VoiceAgentViewProps) {
  const {
    tokenData,
    isLoading,
    error,
    ended,
    location,
    locationError,
    startVoiceSession,
    setManualLocation,
    closeAndLeaveVoice,
    clearLocationError,
    markSessionConnected,
    hasSessionConnected,
    isClosing,
  } = useVoiceAgentSession({ language, portal, initialLocation })

  const chrome = portalChrome(portal)

  const handleEndCall = useCallback(() => {
    closeAndLeaveVoice()
    if (onClose) {
      setTimeout(() => onClose(), 700)
    }
  }, [closeAndLeaveVoice, onClose])

  const handleAgentEnded = useCallback(() => {
    closeAndLeaveVoice()
    if (onClose) {
      setTimeout(() => onClose(), 1400)
    }
  }, [closeAndLeaveVoice, onClose])

  const handleRoomDisconnected = useCallback(() => {
    if (!hasSessionConnected() || isClosing()) return
    closeAndLeaveVoice()
    if (onClose) {
      setTimeout(() => onClose(), 1400)
    }
  }, [closeAndLeaveVoice, onClose, hasSessionConnected, isClosing])

  if (isLoading) {
    return (
      <VoiceAgentShell portal={portal} className={className}>
        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              'relative mb-5 flex h-16 w-16 items-center justify-center rounded-xl border border-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.15)]',
              portal === 'merchant' && 'bg-gradient-to-br from-teal-950 to-stone-950',
              portal === 'admin' && 'bg-gradient-to-br from-slate-950 to-sky-950',
              portal === 'client' && 'bg-gradient-to-br from-[#0B0F17] to-amber-950',
            )}
          >
            <Volume2
              className={cn(
                'h-7 w-7 animate-pulse',
                portal === 'merchant' && 'text-teal-300',
                portal === 'admin' && 'text-sky-300',
                portal === 'client' && 'text-amber-300',
              )}
            />
          </div>
          <p className="text-base font-bold tracking-tight text-slate-900">
            {chrome.voiceConnecting}
          </p>
          <p className="mt-1.5 max-w-xs font-mono text-xs leading-relaxed text-slate-400">
            {VOICE_AGENT_STATUS.initializing}
          </p>
        </div>
      </VoiceAgentShell>
    )
  }

  if (error) {
    return (
      <VoiceAgentShell portal={portal} className={className}>
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] sm:p-7">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-200/60 bg-rose-50 text-rose-600 shadow-xs">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold tracking-tight text-slate-900">
            {VOICE_AGENT_STATUS.error}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{error}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void startVoiceSession()}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-stone-950 px-4.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-stone-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try again</span>
            </button>
            {onSwitchToText ? (
              <button
                type="button"
                onClick={onSwitchToText}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white px-4.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900"
              >
                <span>Switch to chat</span>
              </button>
            ) : null}
          </div>
        </div>
      </VoiceAgentShell>
    )
  }

  if (ended || !tokenData) {
    return (
      <VoiceAgentShell portal={portal} className={className}>
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] sm:p-7">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-100 text-slate-600 shadow-xs">
            <PhoneOff className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold tracking-tight text-slate-900">
            {VOICE_AGENT_STATUS.disconnected}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {isSupportPortal(portal)
              ? 'Thanks for using SalonDesk help. Start another voice session anytime or continue in text chat.'
              : 'Thank you for consulting SalonDesk. Start a new live voice call anytime or continue in text chat.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void startVoiceSession()}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-stone-950 px-4.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-stone-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>New call</span>
            </button>
            {onSwitchToText ? (
              <button
                type="button"
                onClick={onSwitchToText}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white px-4.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900"
              >
                <span>Text chat</span>
              </button>
            ) : onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white px-4.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900"
              >
                <span>Close</span>
              </button>
            ) : null}
          </div>
        </div>
      </VoiceAgentShell>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-1 flex-col overflow-hidden',
        isMinimized && 'overflow-visible',
        className,
      )}
    >
      <LiveKitRoom
        token={tokenData.token}
        serverUrl={tokenData.serverUrl}
        connect
        audio={false}
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
        onConnected={markSessionConnected}
        onDisconnected={handleRoomDisconnected}
        className="flex flex-1 flex-col"
      >
        <RoomAudioRenderer />
        <InnerVoiceAssistantUI
          language={language}
          portal={portal}
          location={location}
          locationError={locationError}
          onEndCall={handleEndCall}
          onAgentEnded={handleAgentEnded}
          clearLocationError={clearLocationError}
          onStartVoiceSession={() => void startVoiceSession()}
          onSetLocation={setManualLocation}
          isMinimized={isMinimized}
          onMinimizeChange={onMinimizeChange}
        />
      </LiveKitRoom>
    </div>
  )
}
