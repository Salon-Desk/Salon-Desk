'use client'

import { Database } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
  className?: string
  fullHeight?: boolean
}

const EmptyState = ({
  title = 'No Records Found',
  description = "There's nothing to display here yet. Once information is added, it will appear in this section.",
  actionLabel,
  onAction,
  icon,
  className,
  fullHeight = true,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-4',
        fullHeight && 'min-h-96 py-20',
        className,
      )}
    >
      {/* Icon container (matches your Database box UI) */}
      <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
        {icon ? (
          icon
        ) : (
          <div className="w-10 h-10 text-gray-400">
            <Database size={40} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

      {/* Description */}
      <p className="text-sm text-gray-500 text-center max-w-md">{description}</p>

      {/* Action */}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="cursor-pointer mt-10 px-10 py-2 text-lg font-semibold text-white bg-primary hover:bg-primary/80 rounded-full transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
