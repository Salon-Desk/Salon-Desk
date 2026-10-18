import { useCallback } from 'react'
import { toast } from 'sonner'

import { toastColor } from '@/constant/toast-color'
import { useCancelBookingMutation } from '@/store/api/clientApi'
import { useMarkBookingNoShowMutation, useMarkBookingShowMutation } from '@/store/api/orgApi'
import type { Booking } from '@/types'

export function useSettlementActions() {
  const [markShow, { isLoading: markingShow }] = useMarkBookingShowMutation()
  const [markNoShow, { isLoading: markingNoShow }] = useMarkBookingNoShowMutation()
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation()

  const isSettlementProcessing = markingShow || markingNoShow || cancelling

  const handleMarkShow = useCallback(
    async (booking: Booking, onSuccess?: () => void) => {
      try {
        await markShow(booking.id).unwrap()
        toast.success(
          `Marked show — full ticket capture completed for ${booking.id.slice(0, 8)}`,
          toastColor.success,
        )
        onSuccess?.()
      } catch (err) {
        const message =
          (err as { data?: { detail?: string } })?.data?.detail || 'Could not mark show'
        toast.error(String(message), toastColor.error)
      }
    },
    [markShow],
  )

  const handleMarkNoShow = useCallback(
    async (booking: Booking, onSuccess?: () => void) => {
      try {
        await markNoShow(booking.id).unwrap()
        toast.success(
          `No-show fee captured and escrow released for ${booking.id.slice(0, 8)}`,
          toastColor.success,
        )
        onSuccess?.()
      } catch (err) {
        const message =
          (err as { data?: { detail?: string } })?.data?.detail || 'Could not mark no-show'
        toast.error(String(message), toastColor.error)
      }
    },
    [markNoShow],
  )

  const handleCancelAndVoid = useCallback(
    async (booking: Booking, onSuccess?: () => void) => {
      try {
        await cancelBooking({ bookingId: booking.id, body: { reason: 'Merchant void' } }).unwrap()
        toast.success(
          `Booking ${booking.id.slice(0, 8)} cancelled and hold voided`,
          toastColor.success,
        )
        onSuccess?.()
      } catch (err) {
        const message =
          (err as { data?: { detail?: string } })?.data?.detail || 'Could not cancel booking'
        toast.error(String(message), toastColor.error)
      }
    },
    [cancelBooking],
  )

  return {
    handleMarkShow,
    handleMarkNoShow,
    handleCancelAndVoid,
    isSettlementProcessing,
  }
}
