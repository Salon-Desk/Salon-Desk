import axiosInstance from '@/lib/axios'
import type { AgentLanguage } from '@/lib/features'

export interface LiveKitTokenOptions {
  language?: AgentLanguage
  participantName?: string
  metadata?: string | Record<string, unknown>
}

export interface LiveKitTokenData {
  token: string
  serverUrl: string
  roomName: string
}

interface LiveKitTokenApiResponse {
  token: string
  server_url: string
  room_name: string
}

/**
 * Mint a LiveKit participant JWT via the backend (API secret stays server-side).
 * POST /api/v1/livekit/token
 */
export async function getLiveKitToken(
  options: LiveKitTokenOptions = {},
): Promise<LiveKitTokenData> {
  const language = options.language ?? 'en'
  const metadata =
    typeof options.metadata === 'string'
      ? options.metadata
      : options.metadata
        ? JSON.stringify(options.metadata)
        : undefined

  const { data } = await axiosInstance.post<LiveKitTokenApiResponse>('/api/v1/livekit/token', {
    language,
    participant_name: options.participantName,
    metadata,
  })

  return {
    token: data.token,
    serverUrl: data.server_url,
    roomName: data.room_name,
  }
}
