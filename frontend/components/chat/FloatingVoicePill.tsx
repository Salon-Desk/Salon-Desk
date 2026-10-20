'use client'

import { Maximize2, Mic, MicOff, PhoneOff } from 'lucide-react'
import React from 'react'

import { type AssistantPortal, portalChrome } from '@/lib/assistant-portal'
import { cn } from '@/lib/utils'

export interface FloatingVoicePillProps {
  portal?: AssistantPortal
  isMuted: boolean
  state: 'connecting' | 'listening' | 'thinking' | 'speaking' | 'idle' | string
  onToggleMute: () => void
  onMaximize: () => void
  onEndCall: () => void
  className?: string
}

export function FloatingVoicePill({
  portal = 'client',
  isMuted,
  state,
  onToggleMute,
  onMaximize,
  onEndCall,
  className,
}: FloatingVoicePillProps) {
  const chrome = portalChrome(portal)
  const isSpeaking = state === 'speaking'
  const isListening = state === 'listening'
  const isThinking = state === 'thinking'

  const statusText = isSpeaking
    ? 'Assistant speaking'
    : isListening
      ? 'Listening...'
      : isThinking
        ? 'Thinking...'
        : 'Voice call live'

  return (
    <div
      role="region"
      aria-label="Active voice call"
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-white/15 bg-stone-950/90 px-4 py-2.5 text-white shadow-[0_12px_36px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95',
        className,
      )}
    >
      {/* Sound wave visual effect */}
      <div className="relative flex h-8 w-8 items-center justify-center">
        <span
          className={cn(
            'absolute inset-0 rounded-full blur-xs transition-opacity duration-300',
            isSpeaking && 'bg-emerald-500/40 animate-pulse',
            isListening && 'bg-amber-500/40 animate-pulse',
            isThinking && 'bg-sky-500/40 animate-spin duration-3000',
            !isSpeaking && !isListening && !isThinking && 'bg-stone-500/20',
          )}
        />
        <div className="relative flex items-center gap-0.5">
          <span
            className={cn(
              'w-0.75 rounded-full bg-amber-400 transition-all duration-200',
              isSpeaking
                ? 'h-5 animate-[pulse_0.4s_ease-in-out_infinite]'
                : isListening
                  ? 'h-3'
                  : 'h-1.5',
            )}
          />
          <span
            className={cn(
              'w-0.75 rounded-full bg-amber-300 transition-all duration-200',
              isSpeaking
                ? 'h-6 animate-[pulse_0.3s_ease-in-out_infinite]'
                : isListening
                  ? 'h-4'
                  : 'h-2.5',
            )}
          />
          <span
            className={cn(
              'w-0.75 rounded-full bg-amber-400 transition-all duration-200',
              isSpeaking
                ? 'h-4 animate-[pulse_0.5s_ease-in-out_infinite]'
                : isListening
                  ? 'h-2'
                  : 'h-1.5',
            )}
          />
        </div>
      </div>

      {/* Label and Status */}
      <div className="flex flex-col pr-1 select-none">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold tracking-tight text-white">{chrome.title}</span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <span className="text-[10px] font-medium text-stone-400">{statusText}</span>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-white/15" />

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleMute}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={cn(
            'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-all',
            isMuted
              ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
              : 'bg-white/10 text-stone-200 hover:bg-white/20 hover:text-white',
          )}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={onMaximize}
          title="Maximize voice agent"
          aria-label="Maximize voice agent"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 text-stone-200 transition-all hover:bg-white/20 hover:text-white"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onEndCall}
          title="End voice call"
          aria-label="End voice call"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-rose-600 text-white shadow-xs transition-all hover:bg-rose-500"
        >
          <PhoneOff className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
