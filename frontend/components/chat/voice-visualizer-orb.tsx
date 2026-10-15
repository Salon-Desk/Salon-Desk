'use client'

import { cn } from '@/lib/utils'

type OrbState = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'idle' | string

interface VoiceVisualizerOrbProps {
  state: OrbState
  className?: string
}

const STATE_RING: Record<string, string> = {
  connecting: 'from-stone-300/50 via-stone-200/30 to-transparent',
  listening: 'from-rose-400/45 via-rose-300/20 to-transparent',
  thinking: 'from-amber-400/50 via-amber-300/25 to-transparent',
  speaking: 'from-emerald-400/45 via-teal-300/20 to-transparent',
  idle: 'from-stone-300/40 via-stone-200/15 to-transparent',
}

export function VoiceVisualizerOrb({ state, className }: VoiceVisualizerOrbProps) {
  const ring = STATE_RING[state] ?? STATE_RING.idle
  const active = state === 'listening' || state === 'speaking' || state === 'thinking'

  return (
    <div className={cn('relative flex h-40 w-40 items-center justify-center', className)}>
      <div
        className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-br opacity-80 blur-sm transition-all duration-500',
          ring,
          active && 'animate-pulse',
        )}
      />
      <div
        className={cn(
          'absolute inset-2 rounded-full border border-white/40 bg-gradient-to-br from-stone-900/5 via-white/30 to-amber-100/40 shadow-[0_20px_50px_-12px_rgba(28,25,23,0.35)] transition-transform duration-500',
          state === 'speaking' && 'scale-105',
          state === 'listening' && 'scale-[1.04]',
        )}
      />
      <div
        className={cn(
          'absolute inset-6 rounded-full bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 shadow-inner transition-transform duration-500',
          state === 'speaking' && 'scale-105',
          state === 'listening' && 'scale-[1.03]',
        )}
      />
      <div className="relative z-10 flex h-20 w-20 items-center justify-center">
        <span
          className={cn(
            'block rounded-full bg-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.55)] transition-all duration-300',
            state === 'speaking' && 'h-5 w-5 bg-emerald-300 shadow-emerald-400/50',
            state === 'listening' && 'h-4 w-4 bg-rose-300 shadow-rose-400/50',
            state === 'thinking' && 'h-3.5 w-3.5 animate-ping bg-amber-300',
            !['speaking', 'listening', 'thinking'].includes(state) && 'h-3 w-3',
          )}
        />
      </div>
      {active ? (
        <>
          <span className="absolute inset-0 animate-ping rounded-full border border-amber-400/20 duration-1000" />
          <span className="absolute inset-3 animate-pulse rounded-full border border-white/10" />
        </>
      ) : null}
    </div>
  )
}
