import type { Tone } from '@/lib/status'

import type { HoldState } from './booking'

export const HOLD_STATUSES = [
  'HELD',
  'CAPTURED',
  'NO_SHOW_CAPTURED',
  'REAUTHORIZED',
  'VOIDED',
  'PENDING',
  'PENDING_PAYMENT',
  'REFUNDED',
] as const

export type HoldStatus = (typeof HOLD_STATUSES)[number]

export interface HoldStatusMeta {
  label: string
  tone: Tone
  variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'neutral'
  isLive: boolean
  isCaptured: boolean
}

export function getHoldStatusMeta(status: HoldState | HoldStatus | string): HoldStatusMeta {
  switch (status) {
    case 'HELD':
      return { label: 'Held', tone: 'amber', variant: 'warning', isLive: true, isCaptured: false }
    case 'REAUTHORIZED':
      return {
        label: 'Reauthorized',
        tone: 'sky',
        variant: 'secondary',
        isLive: true,
        isCaptured: false,
      }
    case 'CAPTURED':
      return {
        label: 'Captured',
        tone: 'emerald',
        variant: 'success',
        isLive: false,
        isCaptured: true,
      }
    case 'NO_SHOW_CAPTURED':
      return {
        label: 'No-show fee',
        tone: 'rose',
        variant: 'destructive',
        isLive: false,
        isCaptured: true,
      }
    case 'VOIDED':
      return {
        label: 'Voided',
        tone: 'slate',
        variant: 'neutral',
        isLive: false,
        isCaptured: false,
      }
    case 'REFUNDED':
      return {
        label: 'Refunded',
        tone: 'purple',
        variant: 'secondary',
        isLive: false,
        isCaptured: false,
      }
    case 'PENDING':
    case 'PENDING_PAYMENT':
    default:
      return {
        label: 'Payment Pending',
        tone: 'amber',
        variant: 'warning',
        isLive: false,
        isCaptured: false,
      }
  }
}
