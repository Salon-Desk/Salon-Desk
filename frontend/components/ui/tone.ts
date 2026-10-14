import type { Tone } from '@/lib/status'

/**
 * Tailwind cannot build class names dynamically, so every tone variant is
 * enumerated here. Components take a `Tone` and look up the strings they need,
 * which keeps colour decisions in one file.
 */

/** Pale fill + tinted text + matching hairline. Used by badges and info panels. */
export const TONE_SOFT: Record<Tone, string> = {
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  sky: 'bg-sky-50 text-sky-800 border-sky-200',
  rose: 'bg-rose-50 text-rose-800 border-rose-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  purple: 'bg-purple-50 text-purple-800 border-purple-200',
  blue: 'bg-blue-50 text-blue-800 border-blue-200',
}

/** Saturated fill for emphasis chips and selected pills. */
export const TONE_SOLID: Record<Tone, string> = {
  amber: 'bg-amber-500 text-slate-950 border-amber-500',
  emerald: 'bg-emerald-600 text-white border-emerald-600',
  sky: 'bg-sky-600 text-white border-sky-600',
  rose: 'bg-rose-600 text-white border-rose-600',
  slate: 'bg-slate-700 text-white border-slate-700',
  purple: 'bg-purple-600 text-white border-purple-600',
  blue: 'bg-blue-600 text-white border-blue-600',
}

/** Square icon chip that sits beside a metric or section title. */
export const TONE_ICON_CHIP: Record<Tone, string> = {
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  sky: 'bg-sky-50 border-sky-200 text-sky-700',
  rose: 'bg-rose-50 border-rose-200 text-rose-700',
  slate: 'bg-slate-100 border-slate-200 text-slate-600',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
}

/** Interactive surface for schedule cards — tinted background with hover accent. */
export const TONE_SURFACE: Record<Tone, string> = {
  amber: 'bg-amber-50/80 border-amber-300 hover:border-amber-500',
  emerald: 'bg-emerald-50 border-emerald-300 hover:border-emerald-500',
  sky: 'bg-sky-50 border-sky-300 hover:border-sky-500',
  rose: 'bg-rose-50 border-rose-300 hover:border-rose-500',
  slate: 'bg-slate-100 border-slate-200 opacity-60',
  purple: 'bg-purple-50 border-purple-300 hover:border-purple-500',
  blue: 'bg-blue-50 border-blue-300 hover:border-blue-500',
}

/** Border colour used for card hover affordances. */
export const TONE_HOVER_BORDER: Record<Tone, string> = {
  amber: 'hover:border-amber-400',
  emerald: 'hover:border-emerald-400',
  sky: 'hover:border-sky-400',
  rose: 'hover:border-rose-400',
  slate: 'hover:border-slate-300',
  purple: 'hover:border-purple-400',
  blue: 'hover:border-blue-400',
}

/** Solid dot used in legends and status rows. */
export const TONE_DOT: Record<Tone, string> = {
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-400',
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
}

/** Foreground-only colour for emphasised numbers. */
export const TONE_TEXT: Record<Tone, string> = {
  amber: 'text-amber-700',
  emerald: 'text-emerald-700',
  sky: 'text-sky-700',
  rose: 'text-rose-700',
  slate: 'text-slate-700',
  purple: 'text-purple-700',
  blue: 'text-blue-700',
}

export type { Tone }
