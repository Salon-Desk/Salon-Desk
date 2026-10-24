'use client'

import type { LucideIcon } from 'lucide-react'
import { Database } from 'lucide-react'
import React, { isValidElement, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: LucideIcon | ReactNode
  title?: string
  description?: string
  action?: ReactNode
  actionLabel?: string
  onAction?: () => void
  className?: string
  /** `editorial` matches client bookings; `console` is denser for admin/merchant. */
  variant?: 'editorial' | 'console'
  fullHeight?: boolean
}

export const EmptyState = ({
  icon,
  title = 'No Records Found',
  description = "There's nothing to display here yet. Once information is added, it will appear in this section.",
  action,
  actionLabel,
  onAction,
  className,
  variant = 'editorial',
  fullHeight,
}: EmptyStateProps) => {
  const isEditorial = variant === 'editorial'

  const renderIcon = () => {
    if (!icon) {
      if (isEditorial) {
        return (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-stone-400">
            <Database className="h-6 w-6" />
          </div>
        )
      }
      return null
    }

    if (isValidElement(icon)) {
      return (
        <div
          className={cn(
            'mx-auto mb-4 flex h-12 w-12 items-center justify-center',
            isEditorial
              ? 'rounded-full bg-white text-stone-400'
              : 'rounded-xl border border-amber-200/70 bg-amber-50 text-amber-700',
          )}
        >
          {icon}
        </div>
      )
    }

    if (typeof icon === 'function' || typeof icon === 'object') {
      const IconComponent = icon as LucideIcon
      return (
        <div
          className={cn(
            'mx-auto mb-4 flex h-12 w-12 items-center justify-center',
            isEditorial
              ? 'rounded-full bg-white text-stone-400'
              : 'rounded-xl border border-amber-200/70 bg-amber-50 text-amber-700',
          )}
        >
          <IconComponent className="h-6 w-6" />
        </div>
      )
    }

    return null
  }

  return (
    <div
      className={cn(
        'text-center w-full',
        isEditorial
          ? 'rounded-3xl border border-stone-200/40 bg-stone-100/50 p-10 sm:p-14'
          : 'mx-auto max-w-md rounded-xl border border-slate-200/80 bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
        fullHeight && 'min-h-96 py-20',
        className,
      )}
    >
      {renderIcon()}

      <h3
        className={cn(
          isEditorial
            ? 'font-serif text-lg font-medium text-stone-950'
            : 'mb-1 font-bold text-sm text-slate-900',
        )}
      >
        {title}
      </h3>

      {description ? (
        <p
          className={cn(
            'leading-relaxed',
            isEditorial
              ? 'mx-auto mt-1 max-w-sm text-xs text-stone-500'
              : 'mb-4 text-xs text-slate-500',
          )}
        >
          {description}
        </p>
      ) : null}

      {action ? (
        action
      ) : actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            'mt-5 cursor-pointer rounded-full px-5 py-2.5 text-xs font-medium text-white transition-colors',
            isEditorial ? 'bg-stone-950 hover:bg-stone-800' : 'bg-slate-900 hover:bg-slate-800',
          )}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

export default EmptyState
