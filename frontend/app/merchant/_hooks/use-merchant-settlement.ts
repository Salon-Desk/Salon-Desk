'use client'

import { useCallback } from 'react'

import { createLedgerId, createPaypalDebugId } from '@/lib/ids'
import type { StateUpdater } from '@/lib/store'
import type { MerchantConsoleState } from '@/lib/store/merchant-store'
import type { AuditLedgerEntry, Booking, HoldState } from '@/types'

export interface UseMerchantSettlementOptions {
  setState: (updater: StateUpdater<MerchantConsoleState>) => MerchantConsoleState
  isSettlementProcessing: boolean
  setIsSettlementProcessing: (value: boolean) => void
  showToast: (message: string) => void
  showIdempotencyNotice: (message: string) => void
  onBookingSettled: (booking: Booking | null) => void
}

export function useMerchantSettlement({
  setState,
  isSettlementProcessing,
  setIsSettlementProcessing,
  showToast,
  showIdempotencyNotice,
  onBookingSettled,
}: UseMerchantSettlementOptions) {
  const handleMarkShow = useCallback(
    (booking: Booking) => {
      if (isSettlementProcessing) return
      setIsSettlementProcessing(true)

      const idempotencyKey = `REQ_${booking.id}_CAPTURE_SHOW`
      showIdempotencyNotice(
        `Idempotency Check: Key ${idempotencyKey} locked. Sending Capture request to PayPal Orders v2...`,
      )

      window.setTimeout(() => {
        let nextBooking: Booking | null = null
        setState((prev) => {
          const updatedBookings = prev.bookings.map((b) => {
            if (b.id === booking.id) {
              nextBooking = {
                ...b,
                status: 'CAPTURED' as HoldState,
                settledAt: 'Just now',
                settlementNote: `Client attended appointment. Full ticket price ($${b.servicePrice}.00) captured via PayPal Orders v2.`,
              }
              return nextBooking
            }
            return b
          })

          const newLedgerEntry: AuditLedgerEntry = {
            id: createLedgerId(),
            bookingId: booking.id,
            clientName: booking.clientName,
            serviceName: booking.serviceName,
            action: 'FULL_PAYMENT_CAPTURED',
            amount: booking.servicePrice,
            currency: 'USD',
            paypalDebugId: createPaypalDebugId('CAPTURE'),
            webhookVerified: true,
            timestamp: 'Just now',
            details: `Mark Show: Full ticket capture of $${booking.servicePrice}.00 executed. Authorization hold converted to final settlement.`,
          }

          return {
            ...prev,
            bookings: updatedBookings,
            auditLedger: [newLedgerEntry, ...prev.auditLedger],
          }
        })

        onBookingSettled(nextBooking)
        setIsSettlementProcessing(false)
        showToast(
          `Appointment ${booking.id} marked SHOW: $${booking.servicePrice}.00 captured successfully!`,
        )
      }, 600)
    },
    [
      isSettlementProcessing,
      onBookingSettled,
      setIsSettlementProcessing,
      setState,
      showIdempotencyNotice,
      showToast,
    ],
  )

  const handleMarkNoShow = useCallback(
    (booking: Booking) => {
      if (isSettlementProcessing) return
      setIsSettlementProcessing(true)

      const idempotencyKey = `REQ_${booking.id}_CAPTURE_NOSHOW`
      showIdempotencyNotice(
        `Idempotency Guard: Key ${idempotencyKey} engaged. Capturing no-show fee ($${booking.noShowFee}) with final_capture: true; releasing remainder ($${booking.holdAmount - booking.noShowFee})...`,
      )

      window.setTimeout(() => {
        const remainderReleased = booking.holdAmount - booking.noShowFee
        let nextBooking: Booking | null = null
        setState((prev) => {
          const updatedBookings = prev.bookings.map((b) => {
            if (b.id === booking.id) {
              nextBooking = {
                ...b,
                status: 'NO_SHOW_CAPTURED' as HoldState,
                settledAt: 'Just now',
                settlementNote: `Client missed slot. Partial no-show fee of $${b.noShowFee}.00 captured with final_capture: true. Remaining $${remainderReleased}.00 hold balance released immediately.`,
              }
              return nextBooking
            }
            return b
          })

          const newLedgerEntry: AuditLedgerEntry = {
            id: createLedgerId(),
            bookingId: booking.id,
            clientName: booking.clientName,
            serviceName: booking.serviceName,
            action: 'NO_SHOW_FEE_CAPTURED',
            amount: booking.noShowFee,
            currency: 'USD',
            paypalDebugId: createPaypalDebugId('NOSHOW'),
            webhookVerified: true,
            timestamp: 'Just now',
            details: `Mark No-Show: $${booking.noShowFee}.00 fee captured. Remainder of $${remainderReleased}.00 released back to buyer card.`,
          }

          return {
            ...prev,
            bookings: updatedBookings,
            auditLedger: [newLedgerEntry, ...prev.auditLedger],
          }
        })

        onBookingSettled(nextBooking)
        setIsSettlementProcessing(false)
        showToast(
          `No-Show fee ($${booking.noShowFee}.00) captured; remaining $${remainderReleased}.00 hold released.`,
        )
      }, 650)
    },
    [
      isSettlementProcessing,
      onBookingSettled,
      setIsSettlementProcessing,
      setState,
      showIdempotencyNotice,
      showToast,
    ],
  )

  const handleCancelAndVoid = useCallback(
    (booking: Booking) => {
      if (isSettlementProcessing) return
      setIsSettlementProcessing(true)

      const idempotencyKey = `REQ_${booking.id}_VOID`
      showIdempotencyNotice(
        `Idempotency Check: Key ${idempotencyKey}. Voiding PayPal authorization hold immediately ($0 charged)...`,
      )

      window.setTimeout(() => {
        let nextBooking: Booking | null = null
        setState((prev) => {
          const updatedBookings = prev.bookings.map((b) => {
            if (b.id === booking.id) {
              nextBooking = {
                ...b,
                status: 'VOIDED' as HoldState,
                settledAt: 'Just now',
                settlementNote:
                  'Appointment cancelled within policy window. PayPal authorization hold voided ($0 charged).',
              }
              return nextBooking
            }
            return b
          })

          const newLedgerEntry: AuditLedgerEntry = {
            id: createLedgerId(),
            bookingId: booking.id,
            clientName: booking.clientName,
            serviceName: booking.serviceName,
            action: 'AUTHORIZATION_VOIDED',
            amount: booking.holdAmount,
            currency: 'USD',
            paypalDebugId: createPaypalDebugId('VOID'),
            webhookVerified: true,
            timestamp: 'Just now',
            details:
              'Appointment cancelled in policy window. PayPal authorization voided immediately, hold released with zero penalties.',
          }

          return {
            ...prev,
            bookings: updatedBookings,
            auditLedger: [newLedgerEntry, ...prev.auditLedger],
          }
        })

        onBookingSettled(nextBooking)
        setIsSettlementProcessing(false)
        showToast(`Appointment ${booking.id} cancelled. Authorization hold voided with $0 penalty.`)
      }, 550)
    },
    [
      isSettlementProcessing,
      onBookingSettled,
      setIsSettlementProcessing,
      setState,
      showIdempotencyNotice,
      showToast,
    ],
  )

  const handleReauthorizeHold = useCallback(
    (booking: Booking) => {
      let nextBooking: Booking | null = null
      setState((prev) => {
        const updatedBookings = prev.bookings.map((b) => {
          if (b.id === booking.id) {
            nextBooking = {
              ...b,
              status: 'REAUTHORIZED' as HoldState,
              honorPeriodEndsInHours: 72,
            }
            return nextBooking
          }
          return b
        })

        const newLedgerEntry: AuditLedgerEntry = {
          id: createLedgerId(),
          bookingId: booking.id,
          clientName: booking.clientName,
          serviceName: booking.serviceName,
          action: 'HONOR_PERIOD_REAUTHORIZED',
          amount: booking.holdAmount,
          currency: 'USD',
          paypalDebugId: createPaypalDebugId('REAUTH'),
          webhookVerified: true,
          timestamp: 'Just now',
          details: 'PayPal honor period extended for 72 hours via PayPal reauthorization API.',
        }

        return {
          ...prev,
          bookings: updatedBookings,
          auditLedger: [newLedgerEntry, ...prev.auditLedger],
        }
      })

      onBookingSettled(nextBooking)
      showToast(`Honor period refreshed for ${booking.clientName}! 72 hours active.`)
    },
    [onBookingSettled, setState, showToast],
  )

  return {
    handleMarkShow,
    handleMarkNoShow,
    handleCancelAndVoid,
    handleReauthorizeHold,
  }
}
