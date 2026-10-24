'use client'

import { ArrowRight, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { Badge, buttonClasses } from '@/components/ui'
import type { Tone } from '@/lib/status'

export interface AppCardProps {
  title: string
  description: string
  badge?: string
  badgeTone?: Tone
  icon: LucideIcon
  route?: string
  onClick?: () => void
  actionLabel: string
}

const ACTION_CLASSES: Partial<Record<Tone, string>> = {
  amber:
    'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700',
  sky: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-500/20 hover:from-sky-700 hover:to-blue-700',
  emerald:
    'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700',
  purple:
    'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700',
}

const ICON_BG_CLASSES: Partial<Record<Tone, string>> = {
  amber:
    'bg-amber-50 text-amber-600 border-amber-200 group-hover:bg-amber-100/70 group-hover:border-amber-300',
  sky: 'bg-sky-50 text-sky-600 border-sky-200 group-hover:bg-sky-100/70 group-hover:border-sky-300',
  emerald:
    'bg-emerald-50 text-emerald-600 border-emerald-200 group-hover:bg-emerald-100/70 group-hover:border-emerald-300',
  purple:
    'bg-purple-50 text-purple-600 border-purple-200 group-hover:bg-purple-100/70 group-hover:border-purple-300',
}

const TITLE_HOVER_CLASSES: Partial<Record<Tone, string>> = {
  amber: 'group-hover:text-amber-700',
  sky: 'group-hover:text-sky-700',
  emerald: 'group-hover:text-emerald-700',
  purple: 'group-hover:text-purple-700',
}

const CARD_HOVER_BORDER_CLASSES: Partial<Record<Tone, string>> = {
  amber: 'hover:border-amber-400/80 hover:shadow-amber-500/10',
  sky: 'hover:border-sky-400/80 hover:shadow-sky-500/10',
  emerald: 'hover:border-emerald-400/80 hover:shadow-emerald-500/10',
  purple: 'hover:border-purple-400/80 hover:shadow-purple-500/10',
}

export function AppCard({
  title,
  description,
  badge,
  badgeTone = 'amber',
  icon: Icon,
  route,
  onClick,
  actionLabel,
}: AppCardProps) {
  const cardContent = (
    <div
      className={`group relative flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${
        CARD_HOVER_BORDER_CLASSES[badgeTone] ?? 'hover:border-amber-400/80'
      }`}
    >
      <div>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300 ${
              ICON_BG_CLASSES[badgeTone] ?? 'bg-amber-50 text-amber-600 border-amber-200'
            }`}
          >
            <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          </div>
          {badge && <Badge tone={badgeTone}>{badge}</Badge>}
        </div>

        <div className="space-y-2">
          <h2
            className={`text-lg sm:text-xl font-bold text-slate-900 transition-colors duration-200 ${
              TITLE_HOVER_CLASSES[badgeTone] ?? 'group-hover:text-amber-700'
            }`}
          >
            {title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <div
          className={buttonClasses({
            size: 'md',
            fullWidth: true,
            className: `${
              ACTION_CLASSES[badgeTone] ?? ACTION_CLASSES.amber
            } cursor-pointer font-medium`,
          })}
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  )

  if (route) {
    return (
      <Link href={route} className="block h-full no-underline">
        {cardContent}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block h-full w-full text-left cursor-pointer p-0 border-0 bg-transparent"
      >
        {cardContent}
      </button>
    )
  }

  return cardContent
}
