/** Copy and defaults for the LiveKit voice concierge UI. */

export const VOICE_AGENT_SUGGESTIONS = [
  'Find salons near me',
  'Log into my account',
  'Sign up for an account',
  'What is the hold policy?',
] as const

export const VOICE_AGENT_STATUS = {
  connecting: 'Connecting to voice concierge…',
  initializing: 'Getting the room ready…',
  listening: 'Listening — speak or type',
  thinking: 'One moment…',
  speaking: 'Talking…',
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
