import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  actionLabel?: string
  onAction?: () => void
  className?: string
  /** `editorial` matches client bookings; `console` is denser for admin/merchant. */
  variant?: 'editorial' | 'console'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className,
  variant = 'editorial',
}: EmptyStateProps) {
  const isEditorial = variant === 'editorial'

  return (
    <div
      className={cn(
        'text-center w-full',
        isEditorial
          ? 'rounded-3xl border border-stone-200/40 bg-stone-100/50 p-10 sm:p-14'
          : 'mx-auto max-w-md rounded-xl border border-slate-200/80 bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
        className,
      )}
    >
      {Icon ? (
        <div
          className={cn(
            'mx-auto mb-4 flex h-12 w-12 items-center justify-center',
            isEditorial
              ? 'rounded-full bg-white text-stone-400'
              : 'rounded-xl border border-amber-200/70 bg-amber-50 text-amber-700',
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      ) : null}

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
