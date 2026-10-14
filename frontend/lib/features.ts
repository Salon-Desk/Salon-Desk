/** Client feature flags (NEXT_PUBLIC_* — rebuild after changing). */

function envFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  return raw === '1' || raw.toLowerCase() === 'true'
}

export type AgentLanguage = 'en'

export const features = {
  agentChat: envFlag('NEXT_PUBLIC_ENABLE_AGENT_CHAT', true),
  voiceAgent: envFlag('NEXT_PUBLIC_ENABLE_VOICE_AGENT', true),
  /** Fixed English — product is English-only. */
  defaultLanguage: 'en' as AgentLanguage,
}

export const anyChatFeatureEnabled = features.agentChat || features.voiceAgent
