import { useCallback } from 'react'
import { toast } from 'sonner'

import { toastColor } from '@/constant/toast-color'
import { useCancelBookingMutation } from '@/store/api/clientApi'
import {
  useMarkBookingNoShowMutation,
  useMarkBookingShowMutation,
  useReauthorizeBookingHoldMutation,
} from '@/store/api/orgApi'
import type { Booking } from '@/types'

export function useSettlementActions() {
  const [markShow, { isLoading: markingShow }] = useMarkBookingShowMutation()
  const [markNoShow, { isLoading: markingNoShow }] = useMarkBookingNoShowMutation()
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation()
  const [reauthorizeHold, { isLoading: reauthorizing }] = useReauthorizeBookingHoldMutation()

  const isSettlementProcessing = markingShow || markingNoShow || cancelling || reauthorizing

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

  const handleReauthorizeHold = useCallback(
    async (booking: Booking, onSuccess?: (updated?: Booking) => void) => {
      try {
        const hold = await reauthorizeHold(booking.id).unwrap()
        const honor = hold.honor_expires_at
          ? new Date(hold.honor_expires_at).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
          : '72h window'
        toast.success(`Hold reauthorized — honor period extended (${honor})`, toastColor.success)
        onSuccess?.({
          ...booking,
          status: 'REAUTHORIZED',
          paypalAuthId: hold.latest_authorization_id || booking.paypalAuthId,
          honorExpiresLabel: honor,
          reauthorizationCount: hold.reauthorization_count,
          reauthorizedAt: 'Just now',
          honorPeriodEndsInHours: 72,
        })
      } catch (err) {
        const message =
          (err as { data?: { detail?: string } })?.data?.detail || 'Could not reauthorize hold'
        toast.error(String(message), toastColor.error)
      }
    },
    [reauthorizeHold],
  )

  return {
    handleMarkShow,
    handleMarkNoShow,
    handleCancelAndVoid,
    handleReauthorizeHold,
    isSettlementProcessing,
  }
}
