'use client'

import { useCallback, useEffect, useState } from 'react'

export type GeolocationCoords = { lat: number; lng: number }

export type GeolocationStatus = 'idle' | 'pending' | 'ready' | 'denied' | 'unsupported' | 'error'

export interface UseGeolocationResult {
  coords: GeolocationCoords | null
  status: GeolocationStatus
  error: string | null
  request: () => void
}

/**
 * Request browser geolocation once on mount (and on demand via `request`).
 * Safe for SSR: no navigator access until client effect.
 */
export function useGeolocation(options?: { requestOnMount?: boolean }): UseGeolocationResult {
  const requestOnMount = options?.requestOnMount ?? true
  const [coords, setCoords] = useState<GeolocationCoords | null>(null)
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported')
      setError('Geolocation is not supported in this browser')
      return
    }

    setStatus('pending')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('ready')
        setError(null)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied')
          setError('Location permission denied')
        } else {
          setStatus('error')
          setError(err.message || 'Could not determine location')
        }
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    )
  }, [])

  useEffect(() => {
    if (requestOnMount) request()
  }, [requestOnMount, request])

  return { coords, status, error, request }
}
