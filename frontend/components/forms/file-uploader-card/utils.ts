import { delay } from '@/lib/util/concurrency'

export function isValidImageUrl(value: string): boolean {
  if (!value) {
    return false
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return true
  }
  if (value.startsWith('/') && !value.startsWith('/api/v1/media/')) {
    return true
  }
  return false
}

const TRANSIENT_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504])

export function isTransientUploadError(error: unknown): boolean {
  if (error === null || error === undefined) {
    return true
  }

  if (typeof error !== 'object') {
    return true
  }

  const err = error as { status?: unknown; data?: unknown; message?: unknown }
  const status = typeof err.status === 'number' ? err.status : Number.NaN

  if (TRANSIENT_STATUS_CODES.has(status)) {
    return true
  }

  const text = [err.data, err.message]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')

  if (/timeout|network|ECONNABORTED|ERR_NETWORK/i.test(text)) {
    return true
  }

  return !Number.isFinite(status) && text.length === 0
}

export async function withTransientRetry<T>(
  run: () => Promise<T>,
  options: { retries: number; baseDelayMs: number },
): Promise<T> {
  const { retries, baseDelayMs } = options
  let attempt = 0

  while (true) {
    try {
      return await run()
    } catch (error) {
      if (attempt >= retries || !isTransientUploadError(error)) {
        throw error
      }

      await delay(baseDelayMs * 2 ** attempt)
      attempt += 1
    }
  }
}
