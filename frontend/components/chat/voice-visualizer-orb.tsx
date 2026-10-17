'use client'

import { cn } from '@/lib/utils'

type OrbState = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'idle' | string

interface VoiceVisualizerOrbProps {
  state: OrbState
  className?: string
}

export function VoiceVisualizerOrb({ state, className }: VoiceVisualizerOrbProps) {
  const isListening = state === 'listening'
  const isSpeaking = state === 'speaking'
  const isThinking = state === 'thinking'
  const isConnecting = state === 'connecting'
  const isActive = isListening || isSpeaking || isThinking

  return (
    <div
      className={cn('relative flex h-48 w-48 items-center justify-center select-none', className)}
    >
      {/* Outer Atmospheric Ambient Halo */}
      <div
        className={cn(
          'absolute inset-0 rounded-full blur-2xl transition-all duration-700 pointer-events-none',
          isListening &&
            'bg-gradient-to-tr from-rose-500/25 via-amber-500/20 to-transparent scale-110 animate-pulse',
          isSpeaking &&
            'bg-gradient-to-tr from-emerald-500/30 via-teal-400/25 to-amber-400/15 scale-115 animate-pulse',
          isThinking &&
            'bg-gradient-to-tr from-amber-400/30 via-purple-500/20 to-sky-400/20 scale-105 animate-spin duration-[4000ms]',
          isConnecting &&
            'bg-gradient-to-tr from-slate-400/20 via-amber-300/15 to-transparent scale-100',
          !isActive &&
            !isConnecting &&
            'bg-gradient-to-tr from-amber-500/15 via-slate-300/20 to-transparent scale-95',
        )}
      />

      {/* Outward Sonic Ripple Waves (when active) */}
      {isListening && (
        <>
          <span className="absolute inset-2 rounded-full border border-rose-400/30 animate-ping duration-[1800ms]" />
          <span className="absolute inset-5 rounded-full border border-rose-400/20 animate-ping duration-[2400ms]" />
        </>
      )}
      {isSpeaking && (
        <>
          <span className="absolute inset-2 rounded-full border border-emerald-400/40 animate-ping duration-[1400ms]" />
          <span className="absolute inset-6 rounded-full border border-teal-400/25 animate-ping duration-[2000ms]" />
        </>
      )}
      {isThinking && (
        <span className="absolute inset-3 rounded-full border border-amber-400/30 animate-pulse duration-1000" />
      )}

      {/* Concentric Layer 1: Glass Outer Ring with Specular Edge */}
      <div
        className={cn(
          'absolute inset-3 rounded-full border border-slate-200/90 bg-white/40 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md transition-all duration-500',
          isSpeaking && 'scale-105 border-emerald-300/80',
          isListening && 'scale-102 border-rose-300/80',
          isThinking && 'scale-100 border-amber-300/80',
        )}
      />

      {/* Concentric Layer 2: Deep Obsidian / Metallic Sphere */}
      <div
        className={cn(
          'absolute inset-7 rounded-full bg-gradient-to-br from-[#0B0F17] via-[#141A23] to-[#07090E] shadow-[0_12px_24px_-4px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.15)] transition-transform duration-500 overflow-hidden flex items-center justify-center',
          isSpeaking && 'scale-105',
          isListening && 'scale-[1.03]',
        )}
      >
        {/* Specular Radial Refraction */}
        <div className="absolute -top-6 -left-6 h-20 w-20 rounded-full bg-white/10 blur-md pointer-events-none" />

        {/* Dynamic Acoustic Soundwave Bars in Center */}
        <div className="relative z-10 flex items-center justify-center gap-1.5 h-12 w-24">
          {isSpeaking ? (
            /* Active Voice Equalizer Bars */
            <>
              <span className="w-1 rounded-full bg-gradient-to-t from-emerald-400 to-teal-200 animate-[bounce_0.6s_ease-in-out_infinite] h-4" />
              <span className="w-1 rounded-full bg-gradient-to-t from-emerald-400 to-teal-200 animate-[bounce_0.8s_ease-in-out_infinite_0.15s] h-8" />
              <span className="w-1.5 rounded-full bg-gradient-to-t from-emerald-300 to-white animate-[bounce_0.5s_ease-in-out_infinite_0.3s] h-10 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              <span className="w-1 rounded-full bg-gradient-to-t from-emerald-400 to-teal-200 animate-[bounce_0.7s_ease-in-out_infinite_0.1s] h-7" />
              <span className="w-1 rounded-full bg-gradient-to-t from-emerald-400 to-teal-200 animate-[bounce_0.6s_ease-in-out_infinite_0.25s] h-4" />
            </>
          ) : isListening ? (
            /* Listening Sonic Resonance Waves */
            <>
              <span className="w-1 rounded-full bg-gradient-to-t from-rose-500 to-rose-300 animate-[pulse_1s_ease-in-out_infinite] h-3" />
              <span className="w-1.5 rounded-full bg-gradient-to-t from-rose-400 to-white animate-[pulse_0.7s_ease-in-out_infinite] h-7 shadow-[0_0_12px_rgba(244,63,94,0.7)]" />
              <span className="w-1 rounded-full bg-gradient-to-t from-rose-500 to-rose-300 animate-[pulse_1s_ease-in-out_infinite_0.2s] h-3" />
            </>
          ) : isThinking ? (
            /* Thinking Rotating / Glowing Amber Nucleus */
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-bounce shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300 animate-bounce delay-150 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-bounce delay-300 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
            </div>
          ) : (
            /* Idle High-End Luxury Amber Core */
            <div className="relative flex items-center justify-center">
              <span className="absolute h-5 w-5 rounded-full bg-amber-400/30 blur-sm animate-pulse" />
              <span className="h-3 w-3 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.75)]" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
