import { formatUsd } from '@/lib/format'
import type { Booking } from '@/types'

export function SettlementLabel({ booking }: { booking: Booking }) {
  if (booking.cancellationFeeCharged != null && booking.cancellationFeeCharged > 0) {
    const label =
      booking.cancellationFeeReason === 'late_cancel' ? 'late cancel fee' : 'cancellation fee'
    return (
      <span className="font-medium text-amber-800">
        {formatUsd(booking.cancellationFeeCharged)} {label}
      </span>
    )
  }
  if (booking.status === 'CAPTURED') {
    return (
      <span className="font-medium text-emerald-700">
        {formatUsd(booking.servicePrice)} captured
      </span>
    )
  }
  if (booking.status === 'NO_SHOW_CAPTURED') {
    return <span className="font-medium text-rose-700">{formatUsd(booking.noShowFee)} no-show</span>
  }
  if (booking.status === 'VOIDED') {
    return <span className="font-medium text-stone-400">$0.00 (Hold Voided)</span>
  }
  return <span className="text-stone-400">—</span>
}
