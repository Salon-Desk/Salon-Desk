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
    <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm duration-200 fade-in">
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
          'relative flex max-h-[90vh] w-full animate-in flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl duration-200 zoom-in-95',
          MODAL_SIZES[size],
          className,
        )}
      >
        {!hideHeader && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-slate-200 border-b bg-slate-50/80 px-6 py-4">
            <div className="flex items-start gap-2.5">
              {icon}
              <div>
                {title && (
                  <h2 id={titleId} className="font-bold text-base text-slate-900">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-0.5 text-slate-500 text-xs leading-relaxed">{description}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-slate-200 border-t bg-slate-50 px-6 py-3">
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
    <div className="fixed inset-0 z-50 flex animate-in justify-end bg-slate-900/40 backdrop-blur-sm fade-in">
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
          'relative flex h-full w-full max-w-md animate-in flex-col border-slate-200 border-l bg-white shadow-2xl duration-200 slide-in-from-right-8',
          className,
        )}
      >
        {(title || subtitle) && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-slate-200 border-b bg-slate-50 px-4 py-3.5">
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

        {footer && <div className="shrink-0 border-slate-200 border-t bg-white p-4">{footer}</div>}
      </div>
    </div>
  )
}
