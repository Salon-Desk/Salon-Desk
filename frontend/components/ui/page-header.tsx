'use client'

import { RefreshCw, Sparkles } from 'lucide-react'
import type React from 'react'

import { cn } from '@/lib/utils'

export type PageHeaderVariant = 'banner' | 'card' | 'plain'
export type PageHeaderAccent = 'amber' | 'sky' | 'violet' | 'emerald' | 'slate'

export interface PageHeaderProps {
  /** Page title heading */
  title: React.ReactNode
  /** Subtitle or descriptive paragraph */
  description?: React.ReactNode
  /** Eyebrow label string or custom ReactNode */
  eyebrow?: React.ReactNode
  /** Optional custom icon in eyebrow badge (defaults to Sparkles in banner variant) */
  eyebrowIcon?: React.ReactNode
  /** Pulsing indicator dot in eyebrow (default true for banner, false for card/plain) */
  eyebrowPulse?: boolean
  /** Pill badge adjacent to the title (e.g., '14 Salons', '3 Actionable') */
  badge?: React.ReactNode
  /** Design layout variant */
  variant?: PageHeaderVariant
  /** Color theme accent for gradients and ambient glow */
  accent?: PageHeaderAccent
  /** Toolbar actions: buttons, navigation links, filters */
  actions?: React.ReactNode
  /** Whether to enclose actions inside a docked border container (default true for banner) */
  dockActions?: boolean
  /** Built-in refresh/sync callback */
  onRefresh?: () => void
  /** Loading/refreshing state for refresh button */
  isRefreshing?: boolean
  /** Tooltip/title for refresh button */
  refreshTitle?: string
  /** Text label for refresh button ('Sync', 'Refresh', or custom) */
  refreshLabel?: React.ReactNode
  /** Custom wrapper className */
  className?: string
  /** Custom title className */
  titleClassName?: string
  /** Optional data attribute for automation/agent testing */
  'data-agent-action'?: string
  /** Optional children rendered beneath or within actions */
  children?: React.ReactNode
}

const ACCENT_STYLES: Record<
  PageHeaderAccent,
  {
    cardGradient: string
    glowColor: string
    badgeTag: string
  }
> = {
  amber: {
    cardGradient: 'from-white via-white to-amber-50/70',
    glowColor: 'bg-amber-300/20',
    badgeTag: 'border border-amber-200/80 bg-amber-50 text-amber-800',
  },
  sky: {
    cardGradient: 'from-white via-white to-sky-50/60',
    glowColor: 'bg-sky-300/20',
    badgeTag: 'bg-sky-50 text-sky-800',
  },
  violet: {
    cardGradient: 'from-white via-white to-violet-50/60',
    glowColor: 'bg-violet-300/20',
    badgeTag: 'bg-violet-50 text-violet-800',
  },
  emerald: {
    cardGradient: 'from-white via-white to-emerald-50/60',
    glowColor: 'bg-emerald-300/20',
    badgeTag: 'bg-emerald-50 text-emerald-800',
  },
  slate: {
    cardGradient: 'from-white via-white to-slate-50/70',
    glowColor: 'bg-slate-300/20',
    badgeTag: 'bg-slate-100 text-slate-800',
  },
}

export function PageHeader({
  title,
  description,
  eyebrow,
  eyebrowIcon,
  eyebrowPulse,
  badge,
  variant = 'banner',
  accent = 'amber',
  actions,
  dockActions,
  onRefresh,
  isRefreshing = false,
  refreshTitle,
  refreshLabel,
  className,
  titleClassName,
  'data-agent-action': dataAgentAction,
  children,
}: PageHeaderProps) {
  const showEyebrowPulse = eyebrowPulse ?? variant === 'banner'
  const shouldDockActions = dockActions ?? variant === 'banner'
  const accentTheme = ACCENT_STYLES[accent] || ACCENT_STYLES.amber

  // Render refresh button based on variant
  const renderRefreshButton = () => {
    if (!onRefresh) return null

    if (variant === 'banner') {
      return (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-700 text-xs shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.94] disabled:opacity-50"
          title={refreshTitle ?? 'Sync'}
        >
          <RefreshCw
            className={cn(
              'h-3.5 w-3.5 text-slate-500',
              isRefreshing && 'animate-spin text-amber-600',
            )}
          />
          <span>{refreshLabel ?? 'Sync'}</span>
        </button>
      )
    }

    if (variant === 'plain') {
      return (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
          title={refreshTitle ?? 'Refresh'}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-amber-600')} />
          <span>{refreshLabel ?? 'Refresh'}</span>
        </button>
      )
    }

    // Default card variant button (compact square icon button or labelled)
    if (refreshLabel) {
      return (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title={refreshTitle ?? 'Refresh'}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-amber-600')} />
          <span>{refreshLabel}</span>
        </button>
      )
    }

    return (
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        title={refreshTitle ?? 'Refresh'}
        aria-label={refreshTitle ?? 'Refresh'}
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50/40 disabled:opacity-50"
      >
        <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-amber-600')} />
      </button>
    )
  }

  // Render Eyebrow Badge
  const renderEyebrow = () => {
    if (!eyebrow) return null

    // If a custom element was passed directly, render it as-is
    if (typeof eyebrow !== 'string') {
      return <div className="mb-1">{eyebrow}</div>
    }

    if (variant === 'banner') {
      return (
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-900 shadow-2xs">
          {showEyebrowPulse && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
          )}
          {eyebrowIcon ?? <Sparkles className="h-3.5 w-3.5 text-amber-600" />}
          <span>{eyebrow}</span>
        </div>
      )
    }

    // Card uppercase tag style
    return (
      <span
        className={cn(
          'mb-2 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]',
          accentTheme.badgeTag,
        )}
      >
        {eyebrow}
      </span>
    )
  }

  // Combined action elements
  const hasActions = Boolean(onRefresh || actions || children)
  const actionContent = (
    <>
      {renderRefreshButton()}
      {actions}
      {children}
    </>
  )

  // 1. Banner Variant (Executive / Glowing Hero Card)
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-amber-50/25 to-amber-100/20 p-6 shadow-xs backdrop-blur-md sm:p-8',
          className,
        )}
        data-agent-action={dataAgentAction}
      >
        {/* Ambient background glow accents */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-amber-200/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-2">
            {renderEyebrow()}

            <div className="flex flex-wrap items-center gap-3">
              <h1
                className={cn(
                  'font-extrabold text-slate-900 text-2xl tracking-tight sm:text-3xl',
                  titleClassName,
                )}
              >
                {title}
              </h1>
              {badge && (
                <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-2xs">
                  {badge}
                </span>
              )}
            </div>

            {description && (
              <p className="max-w-2xl text-xs text-slate-600 sm:text-sm leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {hasActions && (
            <div
              className={cn(
                'flex shrink-0 items-center gap-2.5',
                shouldDockActions &&
                  'flex-wrap rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-xs backdrop-blur-sm sm:shrink-0',
              )}
            >
              {actionContent}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 2. Card Variant (Compact Rounded-2xl Card with Accent Tint)
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br p-4 sm:p-6 shadow-2xs',
          accentTheme.cardGradient,
          className,
        )}
        data-agent-action={dataAgentAction}
      >
        <div
          className={cn(
            'pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl',
            accentTheme.glowColor,
          )}
        />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative space-y-1">
            {renderEyebrow()}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1
                className={cn(
                  'font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl',
                  titleClassName,
                )}
              >
                {title}
              </h1>
              {badge && (
                <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-2xs">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
                {description}
              </p>
            )}
          </div>

          {hasActions && (
            <div
              className={cn(
                'relative flex shrink-0 flex-wrap items-center gap-2',
                shouldDockActions &&
                  'rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-xs backdrop-blur-sm',
              )}
            >
              {actionContent}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 3. Plain Variant (Unbordered Flex Header)
  return (
    <div
      className={cn('flex flex-col justify-between gap-4 sm:flex-row sm:items-center', className)}
      data-agent-action={dataAgentAction}
    >
      <div>
        {renderEyebrow()}
        <div className="flex items-center gap-2">
          <h1
            className={cn(
              'font-extrabold text-2xl text-slate-900 tracking-tight sm:text-3xl',
              titleClassName,
            )}
          >
            {title}
          </h1>
          {badge && (
            <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] font-bold text-white shadow-2xs">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-xs text-slate-500 sm:text-sm">{description}</p>}
      </div>

      {hasActions && (
        <div
          className={cn(
            'flex items-center gap-2',
            shouldDockActions &&
              'rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-xs backdrop-blur-sm',
          )}
        >
          {actionContent}
        </div>
      )}
    </div>
  )
}
