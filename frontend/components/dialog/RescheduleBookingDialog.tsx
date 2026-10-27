'use client'

import { Calendar as CalendarIcon, Check, Clock, Loader2, Sparkles, User } from 'lucide-react'
import Image from 'next/image'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { toastColor } from '@/constant/toast-color'
import { formatBookingRef } from '@/lib/format'
import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'
import { useGetBookingAvailabilityQuery, useRescheduleBookingMutation } from '@/store/api/clientApi'
import type { Booking } from '@/types'
import type { ApiBooking } from '@/types/api-booking'

interface RescheduleBookingDialogProps {
  booking: Booking
  open: boolean
  onClose: () => void
  onSuccess?: (updated: ApiBooking) => void
}

export function RescheduleBookingDialog({
  booking,
  open,
  onClose,
  onSuccess,
}: RescheduleBookingDialogProps) {
  // Generate selectable days for the next 14 days starting today
  const availableDays = useMemo(() => {
    const days: { dateStr: string; label: string; weekday: string; isToday: boolean }[] = []
    const now = new Date()
    for (let i = 0; i < 14; i++) {
      const d = new Date()
      d.setDate(now.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const weekday = d.toLocaleDateString(undefined, { weekday: 'short' })
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      days.push({
        dateStr,
        label,
        weekday,
        isToday: i === 0,
      })
    }
    return days
  }, [])

  const [selectedDay, setSelectedDay] = useState<string>(availableDays[0]?.dateStr ?? '')
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const {
    data: availability,
    isLoading: isAvailabilityLoading,
    isFetching: isAvailabilityFetching,
  } = useGetBookingAvailabilityQuery(
    {
      service_id: booking.serviceId,
      day: selectedDay,
      slot_minutes: Math.max(15, booking.durationMin || 30),
    },
    { skip: !booking.serviceId || !selectedDay || !open },
  )

  const [rescheduleBooking, { isLoading: isRescheduling }] = useRescheduleBookingMutation()

  const handleConfirm = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot to reschedule', toastColor.error)
      return
    }

    try {
      const updated = await rescheduleBooking({
        bookingId: booking.id,
        body: {
          starts_at: selectedSlot,
          stylist_id: booking.stylistId || null,
        },
      }).unwrap()

      toast.success('Appointment rescheduled successfully!', toastColor.success)
      onSuccess?.(updated)
      onClose()
    } catch (err: unknown) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail ||
        (err as Error)?.message ||
        'Failed to reschedule appointment'
      toast.error(message, toastColor.error)
    }
  }

  const selectedSlotFormatted = useMemo(() => {
    if (!selectedSlot) return null
    const d = new Date(selectedSlot)
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }, [selectedSlot])

  const slots = availability?.slots ?? []
  const hasAvailableSlots = slots.some((s) => s.available)

  return (
    <CustomResponsiveDialog
      open={open}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      header={
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-amber-600" />
            <h3 className="font-serif text-lg font-normal text-stone-950 sm:text-xl">
              Reschedule Appointment
            </h3>
          </div>
          <p className="text-xs text-stone-500">
            {booking.serviceName} · {booking.salonName} ({formatBookingRef(booking.id)})
          </p>
        </div>
      }
      footer={
        <div className="flex w-full items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isRescheduling}
            className="h-11 flex-1 cursor-pointer rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50 sm:text-sm"
          >
            Cancel
          </button>
          <PrimaryButton
            variant="dark"
            size="sm"
            onClick={handleConfirm}
            isDisabled={!selectedSlot || isRescheduling}
            className="h-11 flex-1 cursor-pointer rounded-full text-xs font-semibold sm:text-sm"
            title={isRescheduling ? 'Rescheduling…' : 'Confirm New Time'}
          />
        </div>
      }
    >
      <div className="space-y-6 py-1">
        {/* Current appointment info banner */}
        <div className="rounded-2xl border border-stone-200/70 bg-stone-50/80 p-3.5 text-xs text-stone-700">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-500 uppercase tracking-wider text-[10px]">
              Current Time
            </span>
            <span className="font-mono text-[11px] text-stone-400">{booking.durationMin} mins</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-medium text-stone-900">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>{booking.appointmentTime}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 pt-2 border-t border-stone-200/50 text-[11px] text-stone-500">
            {booking.stylistPicture ? (
              <Image
                src={booking.stylistPicture}
                alt=""
                width={16}
                height={16}
                unoptimized={shouldUnoptimizedImage(booking.stylistPicture)}
                className="h-4 w-4 rounded-full object-cover"
              />
            ) : (
              <User className="h-3.5 w-3.5 text-stone-400" />
            )}
            <span>With {booking.stylistName}</span>
          </div>
        </div>

        {/* Date Selector Pills */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-stone-800">Select New Date</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {availableDays.map((d) => {
              const isSelected = selectedDay === d.dateStr
              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDay(d.dateStr)
                    setSelectedSlot(null)
                  }}
                  className={`flex shrink-0 flex-col items-center rounded-2xl border px-3 py-2 text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/90 text-amber-950 font-semibold shadow-xs ring-1 ring-amber-600/30'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider">{d.weekday}</span>
                  <span className="text-xs font-bold">{d.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Time Slot Picker */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold text-stone-800">Select Available Slot</label>
            {isAvailabilityFetching && (
              <span className="flex items-center gap-1 text-[11px] text-amber-700">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking live availability…
              </span>
            )}
          </div>

          {isAvailabilityLoading ? (
            <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/50">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
            </div>
          ) : !hasAvailableSlots ? (
            <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-6 text-center text-xs text-stone-500">
              <Sparkles className="mx-auto mb-1.5 h-4 w-4 text-stone-400" />
              No openings available on this date. Please pick another day above.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 max-h-56 overflow-y-auto pr-1">
              {slots.map((slot) => {
                const isSelected = selectedSlot === slot.starts_at
                const timeLabel = new Date(slot.starts_at).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                })

                return (
                  <button
                    key={slot.starts_at}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.starts_at)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-600 text-white shadow-xs font-semibold'
                        : slot.available
                          ? 'border-stone-200 bg-white text-stone-800 hover:border-amber-400 hover:bg-amber-50/40 cursor-pointer'
                          : 'border-stone-100 bg-stone-50 text-stone-300 line-through cursor-not-allowed'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    <span>{timeLabel}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected Slot Confirmation Preview */}
        {selectedSlotFormatted && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950">
            <span className="font-semibold text-emerald-800 uppercase tracking-wider text-[10px] block mb-1">
              New Appointment Slot
            </span>
            <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
              <CalendarIcon className="h-4 w-4 text-emerald-700" />
              <span>{selectedSlotFormatted}</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-800/80">
              Your $0 PayPal authorization hold remains unchanged. Free cancellation deadline
              recalculates based on your new appointment time.
            </p>
          </div>
        )}
      </div>
    </CustomResponsiveDialog>
  )
}
