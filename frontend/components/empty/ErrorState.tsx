// components/common/ErrorState.tsx
'use client'

import Image from 'next/image'

import { resolveImageSrc } from '@/lib/util/remoteImage'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: string
  className?: string
}

const ErrorState = ({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  actionLabel = 'Retry',
  onAction,
  icon,
  className,
}: ErrorStateProps) => {
  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center text-center py-20 px-4 rounded-2xl bg-background border border-border',
        className,
      )}
    >
      {/* Icon */}
      <div className="mb-4">
        <Image
          src={resolveImageSrc(icon, '/svg/empty/error-state.svg')}
          alt="error"
          width={100}
          height={100}
          className="opacity-90"
        />
      </div>

      {/* Title */}
      <h3 className="text-2xl font-semibold text-foreground mb-1">{title}</h3>

      {/* Description */}
      <p className="text-lg font-normal text-text-color max-w-sm">{description}</p>

      {/* Action */}
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default ErrorState
