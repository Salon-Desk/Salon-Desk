'use client'

import { ConnectionState } from 'livekit-client'
import { Mic, MicOff, PhoneOff, Send } from 'lucide-react'
import React from 'react'

import type { PortalChrome } from '@/lib/assistant-portal'
import { cn } from '@/lib/utils'

export interface VoiceControlBarProps {
  chrome: PortalChrome
  isMuted: boolean
  micBlocked: boolean
  draft: string
  setDraft: (draft: string) => void
  toggleMute: () => Promise<void> | void
  onSend: (text?: string) => Promise<void> | void
  onEndCall: () => void
  connectionState: ConnectionState
  isSending: boolean
  support?: boolean
}

export function VoiceControlBar({
  chrome,
  isMuted,
  micBlocked,
  draft,
  setDraft,
  toggleMute,
  onSend,
  onEndCall,
  connectionState,
  isSending,
  support,
}: VoiceControlBarProps) {
  return (
    <div className="border-t border-slate-200/80 bg-white/95 p-3 sm:p-4 backdrop-blur-md">
      {/* Quick Suggestion Pills */}
      <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {chrome.voiceSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={isSending || connectionState !== ConnectionState.Connected}
            onClick={() => void onSend(suggestion)}
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
            void onSend()
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
  )
}
