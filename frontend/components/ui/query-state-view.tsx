'use client'

import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

import PrimaryButton from '@/components/ui/primary-button'

export interface QueryStateViewProps {
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
  loadingLabel?: string
  errorLabel?: string
  children: ReactNode
}

/** Shared loading / error shell for RTK Query pages and panels. */
export function QueryStateView({
  isLoading,
  isError,
  onRetry,
  loadingLabel = 'Loading…',
  errorLabel = 'Could not load data.',
  children,
}: QueryStateViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
        {loadingLabel}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
        <p>{errorLabel}</p>
        {onRetry ? (
          <PrimaryButton
            title="Retry"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="mt-3 h-9 rounded-xl px-4"
            onClick={() => void onRetry()}
          />
        ) : null}
      </div>
    )
  }

  return <>{children}</>
}

export { QueryStateView as AdminQueryState }
export default QueryStateView
