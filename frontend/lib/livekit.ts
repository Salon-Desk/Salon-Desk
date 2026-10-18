import type { AssistantPortal } from '@/lib/assistant-portal'
import axiosInstance from '@/lib/axios'
import type { AgentLanguage } from '@/lib/features'

export interface LiveKitTokenOptions {
  roomName?: string
  language?: AgentLanguage
  participantName?: string
  metadata?: string | Record<string, unknown>
  portal?: AssistantPortal
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

  const { data } = await axiosInstance.post<
    LiveKitTokenApiResponse | { success?: boolean; data?: LiveKitTokenApiResponse }
  >('/api/v1/livekit/token', {
    language,
    participant_name: options.participantName,
    metadata,
    room_name: options.roomName,
    portal: options.portal ?? 'client',
  })

  const payload =
    data &&
    typeof data === 'object' &&
    'success' in data &&
    data.success === true &&
    'data' in data &&
    data.data
      ? data.data
      : (data as LiveKitTokenApiResponse)

  return {
    token: payload.token,
    serverUrl: payload.server_url,
    roomName: payload.room_name,
  }
}
