'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_DURATION_MS = 4000

/**
 * A single auto-dismissing status message. Each portal renders at most one
 * toast at a time, so this deliberately keeps one slot rather than a queue.
 */
export function useToast(durationMs: number = DEFAULT_DURATION_MS) {
  const [message, setMessage] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const dismiss = useCallback(() => {
    clearTimer()
    setMessage(null)
  }, [clearTimer])

  const show = useCallback(
    (next: string) => {
      clearTimer()
      setMessage(next)
      timeoutRef.current = setTimeout(() => setMessage(null), durationMs)
    },
    [clearTimer, durationMs],
  )

  useEffect(() => clearTimer, [clearTimer])

  return { message, show, dismiss }
}
