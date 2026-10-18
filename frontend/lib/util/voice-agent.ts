import { VOICE_AGENT_GOODBYE_PHRASES } from '@/constant/voice-agent'
import type { AssistantPortal } from '@/lib/assistant-portal'
import type { AgentLanguage } from '@/lib/features'

/** True when the latest agent transcript looks like a farewell. */
export function isAgentGoodbyeTranscript(text: string | undefined | null): boolean {
  const normalized = text?.toLowerCase().trim() || ''
  if (!normalized) return false
  return VOICE_AGENT_GOODBYE_PHRASES.some((phrase) => normalized.includes(phrase))
}

export function buildVoiceAgentRoomName(
  language: AgentLanguage,
  portal: AssistantPortal = 'client',
): string {
  return `salondesk-${portal}-agent-${language}-${crypto.randomUUID().slice(0, 6)}`
}

export function parseAgentControlPayload(payload: Uint8Array): { type?: string } | null {
  try {
    return JSON.parse(new TextDecoder().decode(payload)) as { type?: string }
  } catch {
    return null
  }
}

export function isAgentParticipant(identity: string, name: string): boolean {
  const id = identity.toLowerCase()
  const display = name.toLowerCase()
  return id.includes('agent') || display.includes('agent')
}

export function liveKitTokenErrorMessage(err: unknown): string {
  const status = (err as { response?: { status?: number } })?.response?.status
  if (status === 503) {
    return 'Voice agent is unavailable. LiveKit is not configured on the server.'
  }
  return (
    (err as { message?: string })?.message ||
    'Could not initialize voice session. Make sure the backend voice service is running.'
  )
}
