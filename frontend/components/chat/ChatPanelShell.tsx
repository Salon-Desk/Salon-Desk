'use client'

import { Bot, Mic, Minus, X } from 'lucide-react'
import React, { useEffect } from 'react'

import { type AssistantPortal, portalChrome } from '@/lib/assistant-portal'
import { cn } from '@/lib/utils'

export interface ChatPanelShellProps {
  mode: 'chat' | 'voice'
  portal?: AssistantPortal
  onModeChange?: (mode: 'chat' | 'voice') => void
  onClose: () => void
  onMinimize?: () => void
  showModeToggle?: boolean
  children: React.ReactNode
}

/**
 * Reusable assistant avatar with online pulse dot.
 */
export function ConciergeAvatar({
  className,
  size = 'md',
  showDot = false,
  portal = 'client',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showDot?: boolean
  portal?: AssistantPortal
}) {
  const chrome = portalChrome(portal)
  const Icon = chrome.Icon

  const sizeClasses = {
    sm: 'h-7 w-7 rounded-full',
    md: 'h-9 w-9 rounded-full',
    lg: 'h-11 w-11 rounded-full',
  }
  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center text-white shadow-xs',
        chrome.avatar,
        sizeClasses[size],
        className,
      )}
      aria-hidden="true"
    >
      <Icon className={cn(iconSizes[size], chrome.avatarIcon)} />
      {showDot && (
        <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
          <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </span>
      )}
    </div>
  )
}

export function ChatPanelShell({
  mode,
  portal = 'client',
  onModeChange,
  onClose,
  onMinimize,
  showModeToggle = false,
  children,
}: ChatPanelShellProps) {
  const chrome = portalChrome(portal)
  const title = chrome.title
  const subtitle = mode === 'voice' ? chrome.subtitleVoice : chrome.subtitleChat

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end sm:block motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
      {/* Mobile-only backdrop */}
      <button
        type="button"
        aria-label={`Close ${title}`}
        onClick={onClose}
        className="absolute inset-0 h-full w-full pointer-events-auto sm:hidden cursor-default bg-black/25 backdrop-blur-xs"
        tabIndex={-1}
      />

      {/* Floating Dialog: bottom-right anchored on desktop, bottom-sheet on mobile */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label={`SalonDesk ${title}`}
        className={cn(
          'pointer-events-auto relative z-10 flex flex-col overflow-hidden text-stone-900 border border-stone-200/90 shadow-[0_24px_64px_-16px_rgba(28,25,23,0.3),0_0_0_1px_rgba(0,0,0,0.06)]',
          // Mobile: slide up bottom sheet
          'h-[88dvh] max-h-[88dvh] w-full rounded-t-3xl border-b-0 motion-safe:slide-in-from-bottom-8',
          // Desktop: bottom-right anchored widget window like regular apps
          'sm:fixed sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto sm:h-[640px] sm:max-h-[calc(100vh-3.5rem)] sm:w-[410px] sm:max-w-[calc(100vw-3rem)] sm:rounded-2xl sm:motion-safe:slide-in-from-bottom-6 sm:motion-safe:zoom-in-95',
          'motion-safe:duration-250',
          chrome.panelBg,
        )}
      >
        {/* Mobile handle pull bar */}
        <div className="flex justify-center bg-transparent pb-0.5 pt-2.5 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-stone-300/90" aria-hidden="true" />
        </div>

        {/* Panel Header */}
        <header className="flex items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-2.5">
            <ConciergeAvatar size="md" showDot portal={portal} />
            <div className="min-w-0">
              <h2 className="text-[13px] font-semibold tracking-tight text-stone-950 truncate">
                {title}
              </h2>
              <p className="truncate text-[11px] font-medium text-stone-500">{subtitle}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {showModeToggle && onModeChange && (
              <div
                role="tablist"
                aria-label={chrome.modeToggleLabel}
                className="flex items-center rounded-full border border-stone-200/80 bg-stone-100/90 p-0.5"
              >
                <button
                  role="tab"
                  type="button"
                  aria-selected={mode === 'chat'}
                  onClick={() => onModeChange('chat')}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2',
                    chrome.ring,
                    mode === 'chat'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900',
                  )}
                >
                  <Bot className="h-3.5 w-3.5" />
                  Chat
                </button>
                <button
                  role="tab"
                  type="button"
                  aria-selected={mode === 'voice'}
                  onClick={() => onModeChange('voice')}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2',
                    chrome.ring,
                    mode === 'voice'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900',
                  )}
                >
                  <Mic className="h-3.5 w-3.5" />
                  Voice
                </button>
              </div>
            )}

            {onMinimize && (
              <button
                type="button"
                onClick={onMinimize}
                aria-label={`Minimize ${title}`}
                title="Minimize window"
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2',
                  chrome.ring,
                )}
              >
                <Minus className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label={`Close ${title}`}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2',
                chrome.ring,
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}
