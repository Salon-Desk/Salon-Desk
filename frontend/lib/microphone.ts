export type MicAccessFailureReason =
  'insecure' | 'unsupported' | 'denied' | 'not-found' | 'busy' | 'unknown'

export type MicAccessResult =
  { ok: true } | { ok: false; reason: MicAccessFailureReason; message: string }

function messageForReason(reason: MicAccessFailureReason): string {
  switch (reason) {
    case 'insecure':
      return 'Microphone access requires a secure page (HTTPS or localhost).'
    case 'unsupported':
      return 'This browser does not support microphone capture.'
    case 'denied':
      return 'Microphone access was blocked. Allow the mic in your browser site settings, then try again.'
    case 'not-found':
      return 'No microphone was detected. Connect a mic or choose an input device in system settings.'
    case 'busy':
      return 'Your microphone is in use by another app. Close it and try again.'
    default:
      return 'Could not access the microphone. Check permissions and try again.'
  }
}

function reasonFromError(err: unknown): MicAccessFailureReason {
  const name = err instanceof DOMException ? err.name : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'denied'
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'not-found'
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'busy'
  return 'unknown'
}

/** Prompts for mic permission (must run from a user click/tap when possible). */
export async function requestMicrophoneAccess(): Promise<MicAccessResult> {
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'unsupported', message: messageForReason('unsupported') }
  }
  if (!window.isSecureContext) {
    return { ok: false, reason: 'insecure', message: messageForReason('insecure') }
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, reason: 'unsupported', message: messageForReason('unsupported') }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    })
    for (const track of stream.getTracks()) track.stop()
    return { ok: true }
  } catch (err) {
    const reason = reasonFromError(err)
    return { ok: false, reason, message: messageForReason(reason) }
  }
}
