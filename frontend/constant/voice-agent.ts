/** Copy and defaults for the LiveKit voice concierge UI. */

export const VOICE_AGENT_SUGGESTIONS = [
  'Book a Precision Fade',
  'What is the hold policy?',
  'Goodbye',
] as const

export const VOICE_AGENT_STATUS = {
  connecting: 'Connecting to voice concierge…',
  initializing: 'Securing room & waking neural models…',
  listening: 'Listening — speak or type',
  thinking: 'Synthesizing response…',
  speaking: 'Concierge speaking…',
  idle: 'Ready — speak or type below',
  disconnected: 'Session concluded',
  error: 'Voice service unavailable',
  typePlaceholder: 'Type email or appointment details…',
  micBlocked: 'Microphone access needed',
} as const

/** Phrases in agent transcripts that should end the live call. */
export const VOICE_AGENT_GOODBYE_PHRASES = [
  'goodbye',
  'good bye',
  'have a wonderful day',
  'have a great day',
  'ደህና ሁኑ',
] as const
