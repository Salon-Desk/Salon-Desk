/** Locked cancellation fees and free-cancel window from booking snapshots. */

export type CancelFeeReason = 'free_cancel' | 'late_cancel' | 'org_cancel' | string

export interface CancelOutcomePreview {
  withinFreeWindow: boolean
  /** Amount PayPal may capture if the client cancels now. */
  chargeAmount: number
  lateCancelFee: number
  noShowFee: number
  lateCancelPct: number
  noShowPct: number
  freeCancelDeadlineLabel: string
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function parsePolicyNumber(
  policy: Record<string, unknown> | undefined,
  key: string,
): number | null {
  const raw = policy?.[key]
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function feePercentsFromPolicy(policy: Record<string, unknown> | undefined): {
  noShowPct: number
  lateCancelPct: number
} {
  const noShowPct = parsePolicyNumber(policy, 'no_show_fee_percent') ?? 50
  const lateRaw = parsePolicyNumber(policy, 'late_cancel_fee_percent')
  const lateCancelPct = lateRaw ?? noShowPct
  return { noShowPct, lateCancelPct }
}

export function computeLateCancelFee(
  totalPrice: number,
  policy: Record<string, unknown> | undefined,
  lockedLateCancelFee?: number | null,
): number {
  if (lockedLateCancelFee != null && Number.isFinite(lockedLateCancelFee)) {
    return lockedLateCancelFee
  }
  const { lateCancelPct } = feePercentsFromPolicy(policy)
  return roundMoney(totalPrice * (lateCancelPct / 100))
}

export function isWithinFreeCancelWindow(
  freeCancelDeadlineAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!freeCancelDeadlineAt) return false
  const deadline = Date.parse(freeCancelDeadlineAt)
  if (Number.isNaN(deadline)) return false
  return now.getTime() <= deadline
}

export function formatCancelDeadline(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function parseCancellationFee(
  cancellationFeeJson: Record<string, unknown> | null | undefined,
): { fee: number; reason: CancelFeeReason | null } {
  if (!cancellationFeeJson) return { fee: 0, reason: null }
  const fee = Number(cancellationFeeJson.fee ?? 0)
  const reason = cancellationFeeJson.reason
  return {
    fee: Number.isFinite(fee) ? fee : 0,
    reason: typeof reason === 'string' ? reason : null,
  }
}

export function buildCancelOutcomePreview(input: {
  totalPrice: number
  agreedNoShowFee?: number | null
  agreedLateCancelFee?: number | null
  freeCancelDeadlineAt: string | null | undefined
  policySnapshot?: Record<string, unknown>
}): CancelOutcomePreview {
  const policy = input.policySnapshot
  const { noShowPct, lateCancelPct } = feePercentsFromPolicy(policy)
  const noShowFee =
    input.agreedNoShowFee != null && Number.isFinite(input.agreedNoShowFee)
      ? input.agreedNoShowFee
      : roundMoney(input.totalPrice * (noShowPct / 100))
  const lateCancelFee = computeLateCancelFee(input.totalPrice, policy, input.agreedLateCancelFee)
  const withinFreeWindow = isWithinFreeCancelWindow(input.freeCancelDeadlineAt)
  return {
    withinFreeWindow,
    chargeAmount: withinFreeWindow ? 0 : lateCancelFee,
    lateCancelFee,
    noShowFee,
    lateCancelPct,
    noShowPct,
    freeCancelDeadlineLabel: formatCancelDeadline(input.freeCancelDeadlineAt),
  }
}
