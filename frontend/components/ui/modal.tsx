'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useId } from 'react'

import { cn } from '@/lib/utils'

/** Closes on Escape and locks background scroll for as long as a layer is open. */
function useDismissableLayer(onClose: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])
}

const MODAL_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const

export interface ModalProps {
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  size?: keyof typeof MODAL_SIZES
  footer?: ReactNode
  children: ReactNode
  /** Suppresses the default header so a layer can render a bespoke one. */
  hideHeader?: boolean
  className?: string
}

/**
 * Centred dialog. Render it conditionally (`{isOpen && <Modal … />}`) so mount
 * and unmount drive the animation and the scroll lock.
 */
export function Modal({
  onClose,
  title,
  description,
  icon,
  size = 'md',
  footer,
  children,
  hideHeader = false,
  className,
}: ModalProps) {
  const titleId = useId()
  useDismissableLayer(onClose)

  return (
    <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-stone-950/40 p-3 sm:p-6 backdrop-blur-sm duration-200 fade-in">
      {/* Backdrop click target, kept separate from the panel so clicks inside do not bubble out. */}
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'relative flex max-h-[min(92vh,44rem)] w-full animate-in flex-col overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-[0_28px_64px_-16px_rgba(28,25,23,0.28)] duration-200 zoom-in-95',
          MODAL_SIZES[size],
          className,
        )}
      >
        {!hideHeader && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-stone-100 border-b px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-start gap-3">
              {icon ? (
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                  {icon}
                </div>
              ) : null}
              <div className="min-w-0">
                {title && (
                  <h2
                    id={titleId}
                    className="font-serif text-lg font-normal tracking-tight text-stone-950 sm:text-xl"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-stone-500 text-xs leading-relaxed">{description}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer && (
          <div className="flex w-full shrink-0 flex-col items-stretch justify-end gap-2 border-stone-100 border-t bg-stone-50/80 px-5 py-3.5 sm:px-6 sm:flex-row sm:items-center">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export interface DrawerProps {
  onClose: () => void
  title?: ReactNode
  icon?: ReactNode
  subtitle?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

/** Right-hand side panel, used for appointment settlement and AI assistants. */
export function Drawer({
  onClose,
  title,
  icon,
  subtitle,
  footer,
  children,
  className,
}: DrawerProps) {
  const titleId = useId()
  useDismissableLayer(onClose)

  return (
    <div className="fixed inset-0 z-50 flex animate-in justify-end bg-slate-900/35 backdrop-blur-xs fade-in">
      <button
        type="button"
        aria-label="Close panel"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'relative flex h-full w-full max-w-md animate-in flex-col border-slate-200/90 border-l bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.14),inset_0_1px_0_0_rgba(255,255,255,0.9)] duration-200 slide-in-from-right-8',
          className,
        )}
      >
        {(title || subtitle) && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-slate-200/80 border-b bg-slate-50/90 backdrop-blur-md px-4 py-3.5">
            <div className="flex items-center gap-2">
              {icon}
              <div>
                {title && (
                  <h2 id={titleId} className="font-bold text-slate-900 text-sm">
                    {title}
                  </h2>
                )}
                {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div className="shrink-0 border-slate-200/80 border-t bg-white/95 backdrop-blur-md p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
