'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { AgentLanguage } from '@/lib/features'
import { getLiveKitToken, type LiveKitTokenData } from '@/lib/livekit'
import { type GeoCoords, requestGeolocation } from '@/lib/util/geo'
import { buildVoiceAgentRoomName, liveKitTokenErrorMessage } from '@/lib/util/voice-agent'

export interface UseVoiceAgentSessionOptions {
  language: AgentLanguage
  /** Auto-start a session when the hook mounts. */
  startOnMount?: boolean
}

export interface UseVoiceAgentSessionResult {
  tokenData: LiveKitTokenData | null
  isLoading: boolean
  error: string | null
  ended: boolean
  location: GeoCoords | null
  locationError: string | null
  startVoiceSession: () => Promise<void>
  closeAndLeaveVoice: () => void
  clearLocationError: () => void
  markSessionConnected: () => void
  /** True once the LiveKit room has connected at least once this session. */
  hasSessionConnected: () => boolean
  isClosing: () => boolean
}

export function useVoiceAgentSession({
  language,
  startOnMount = true,
}: UseVoiceAgentSessionOptions): UseVoiceAgentSessionResult {
  const [tokenData, setTokenData] = useState<LiveKitTokenData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ended, setEnded] = useState(false)
  const [location, setLocation] = useState<GeoCoords | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const closingRef = useRef(false)
  const sessionConnectedRef = useRef(false)

  const startVoiceSession = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setEnded(false)
    closingRef.current = false
    sessionConnectedRef.current = false
    setLocationError(null)

    let loc: GeoCoords | null = null
    try {
      loc = await requestGeolocation({
        enableHighAccuracy: false,
        timeout: 12_000,
        maximumAge: 60_000,
      })
      setLocation(loc)
    } catch {
      setLocationError('Location permission denied or unavailable.')
    }

    try {
      const data = await getLiveKitToken({
        roomName: buildVoiceAgentRoomName(language),
        language,
        metadata: {
          language,
          app: 'salondesk',
          mode: 'voice',
          ...(loc ? { lat: loc.lat, lng: loc.lng } : {}),
        },
      })
      setTokenData(data)
    } catch (err: unknown) {
      console.error('Failed to acquire LiveKit token:', err)
      setError(liveKitTokenErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [language])

  useEffect(() => {
    if (startOnMount) void startVoiceSession()
  }, [startOnMount, startVoiceSession])

  const closeAndLeaveVoice = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setTokenData(null)
    setEnded(true)
  }, [])

  const clearLocationError = useCallback(() => {
    setLocationError(null)
  }, [])

  return {
    tokenData,
    isLoading,
    error,
    ended,
    location,
    locationError,
    startVoiceSession,
    closeAndLeaveVoice,
    clearLocationError,
    markSessionConnected: () => {
      sessionConnectedRef.current = true
    },
    hasSessionConnected: () => sessionConnectedRef.current,
    isClosing: () => closingRef.current,
  }
}
