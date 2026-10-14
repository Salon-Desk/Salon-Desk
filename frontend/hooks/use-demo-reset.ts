'use client'

import { useCallback, useState } from 'react'

export interface DemoResetStats {
  activeHoldsCount?: number
  capturedCount?: number
  noShowCount?: number
  voidedCount?: number
  totalOrganizations?: number
  ledgerEntries?: number
}

/**
 * Re-seeds a portal's demo data. The server endpoint is advisory — it reports
 * the seed statistics — while `resetLocalState` does the work that the UI
 * actually reads, so a failed request still produces a clean reset.
 */
export function useDemoReset(resetLocalState: () => void) {
  const [isResetting, setIsResetting] = useState(false)

  const reset = useCallback(async (): Promise<DemoResetStats | null> => {
    setIsResetting(true)
    let stats: DemoResetStats | null = null
    try {
      const response = await fetch('/api/demo/reset', { method: 'POST' })
      if (response.ok) {
        const payload = await response.json()
        stats = payload.stats ?? null
      }
    } catch {
      // Offline or endpoint unavailable — the local reset below still applies.
    }
    resetLocalState()
    setIsResetting(false)
    return stats
  }, [resetLocalState])

  return { isResetting, reset }
}
