'use client'

import { cn } from '@/lib/utils'

type OrbState = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'idle' | string

interface VoiceVisualizerOrbProps {
  state: OrbState
  className?: string
}

const STATE_RING: Record<string, string> = {
  connecting: 'bg-stone-300/40 animate-pulse',
  listening: 'bg-rose-400/30 animate-pulse',
  thinking: 'bg-amber-400/35 animate-pulse',
  speaking: 'bg-emerald-400/30 animate-pulse',
  idle: 'bg-stone-200/50',
}

export function VoiceVisualizerOrb({ state, className }: VoiceVisualizerOrbProps) {
  const ring = STATE_RING[state] ?? STATE_RING.idle

  return (
    <div className={cn('relative flex h-36 w-36 items-center justify-center', className)}>
      <div className={cn('absolute inset-0 rounded-full transition-colors duration-300', ring)} />
      <div
        className={cn(
          'absolute inset-4 rounded-full bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 shadow-lg transition-transform duration-500',
          state === 'speaking' && 'scale-105',
          state === 'listening' && 'scale-[1.03]',
        )}
      />
      <div className="relative z-10 flex h-16 w-16 items-center justify-center">
        <span
          className={cn(
            'block h-3 w-3 rounded-full bg-amber-400 transition-all duration-300',
            state === 'speaking' && 'h-4 w-4 bg-emerald-300',
            state === 'listening' && 'h-3.5 w-3.5 bg-rose-300',
            state === 'thinking' && 'animate-ping bg-amber-300',
          )}
        />
      </div>
    </div>
  )
}
