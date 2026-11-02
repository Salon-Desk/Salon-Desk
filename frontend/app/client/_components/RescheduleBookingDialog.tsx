'use client'

import { addDays, format } from 'date-fns'
import { AlertTriangle, Calendar, Clock, Lock, ShieldCheck, User, Users } from 'lucide-react'
import React, { useId, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { toastColor } from '@/constant/toast-color'
import { formatUsd } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useGetCatalogOrgStaffQuery, useRescheduleBookingMutation } from '@/store/api/clientApi'
import { useRescheduleOrgBookingMutation } from '@/store/api/orgApi'
import type { Booking } from '@/types'
import type { ApiBooking } from '@/types/api-booking'

export interface RescheduleBookingDialogProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
  isOrg?: boolean
  onSuccess?: (updatedBooking: ApiBooking) => void
}

export function RescheduleBookingDialog({
  booking,
  isOpen,
  onClose,
  isOrg = false,
  onSuccess,
}: RescheduleBookingDialogProps) {
  const dateInputId = useId()
  const stylistSelectId = useId()
  const [mountNowMs] = useState(() => Date.now())

  // 1. Cutoff Window Calculation
  const cutoffHours = useMemo(() => {
    const raw = booking.policySnapshot?.reschedule_cutoff_hours
    return typeof raw === 'number' ? raw : 4.0
  }, [booking.policySnapshot])

  const { isWithinCutoff, hoursUntilStart } = useMemo(() => {
    if (!booking.startsAt) {
      return { isWithinCutoff: false, hoursUntilStart: 999 }
    }
    const startsAtMs = new Date(booking.startsAt).getTime()
    const diffHours = (startsAtMs - mountNowMs) / (1000 * 60 * 60)
    return {
      isWithinCutoff: diffHours < cutoffHours && diffHours >= -1,
      hoursUntilStart: diffHours,
    }
  }, [booking.startsAt, cutoffHours, mountNowMs])

  // Initial form values
  const defaultDateTime = useMemo(() => {
    if (booking.startsAt) {
      try {
        const d = new Date(booking.startsAt)
        // Convert to local YYYY-MM-DDTHH:mm
        const offset = d.getTimezoneOffset() * 60000
        return new Date(d.getTime() - offset).toISOString().slice(0, 16)
      } catch {
        return ''
      }
    }
    return ''
  }, [booking.startsAt])

  const [selectedDateTime, setSelectedDateTime] = useState<string>(defaultDateTime)
  const [selectedStylistId, setSelectedStylistId] = useState<string>(booking.stylistId || '')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Staff query for salon
  const { data: staffData, isLoading: isLoadingStaff } = useGetCatalogOrgStaffQuery(
    booking.salonId,
    { skip: !booking.salonId },
  )
  const staffMembers = staffData?.items ?? []

  // Mutations for client and org
  const [rescheduleClient, { isLoading: isClientSubmitting }] = useRescheduleBookingMutation()
  const [rescheduleOrg, { isLoading: isOrgSubmitting }] = useRescheduleOrgBookingMutation()

  const isSubmitting = isClientSubmitting || isOrgSubmitting

  // Minimum allowed date (now in local time format)
  const minDateTime = useMemo(() => {
    const now = new Date(mountNowMs)
    const offset = now.getTimezoneOffset() * 60000
    return new Date(now.getTime() - offset).toISOString().slice(0, 16)
  }, [mountNowMs])

  // Allowable reschedule window based on hold creation / authorization date (max 28 days)
  const holdAuthorizedAt = useMemo(() => {
    const raw = booking.paymentHold?.authorizedAt || booking.authorizedAt || booking.createdAt
    if (!raw) return new Date(mountNowMs)
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? new Date(mountNowMs) : d
  }, [booking, mountNowMs])

  const rescheduleMaxDate = useMemo(() => addDays(holdAuthorizedAt, 28), [holdAuthorizedAt])

  const maxDateTime = useMemo(() => {
    const offset = rescheduleMaxDate.getTimezoneOffset() * 60000
    return new Date(rescheduleMaxDate.getTime() - offset).toISOString().slice(0, 16)
  }, [rescheduleMaxDate])

  const isPastMaxCutoff = useMemo(() => {
    if (!selectedDateTime) return false
    const d = new Date(selectedDateTime)
    return !Number.isNaN(d.getTime()) && d.getTime() > rescheduleMaxDate.getTime()
  }, [selectedDateTime, rescheduleMaxDate])

  // Check if anything actually changed
  const hasChanges = useMemo(() => {
    const timeChanged = selectedDateTime && selectedDateTime !== defaultDateTime
    const stylistChanged = selectedStylistId !== (booking.stylistId || '')
    return Boolean(timeChanged || stylistChanged)
  }, [selectedDateTime, defaultDateTime, selectedStylistId, booking.stylistId])

  const canSubmit = !isSubmitting && hasChanges && (isOrg || !isWithinCutoff) && !isPastMaxCutoff

  const handleSubmit = async () => {
    setErrorMessage(null)

    if (!hasChanges) {
      toast.info('No changes were made to time or stylist.', toastColor.info)
      onClose()
      return
    }

    if (isPastMaxCutoff) {
      setErrorMessage(
        `Cannot reschedule past ${format(rescheduleMaxDate, 'MMM d, yyyy')}. PayPal authorization holds expire 29 days from the original booking date. For dates further out, please cancel and create a new reservation.`,
      )
      return
    }

    let isoStartsAt: string | null = null
    let isoEndsAt: string | null = null

    if (selectedDateTime && selectedDateTime !== defaultDateTime) {
      const newStartDate = new Date(selectedDateTime)
      isoStartsAt = newStartDate.toISOString()

      // Keep original appointment duration if available
      const durationMin = booking.durationMin || 60
      const newEndDate = new Date(newStartDate.getTime() + durationMin * 60 * 1000)
      isoEndsAt = newEndDate.toISOString()
    }

    const targetStylistId =
      selectedStylistId !== (booking.stylistId || '') ? selectedStylistId || null : undefined

    try {
      let updatedBooking: ApiBooking
      if (isOrg) {
        updatedBooking = await rescheduleOrgBookingPayload({
          bookingId: booking.id,
          body: {
            starts_at: isoStartsAt,
            ends_at: isoEndsAt,
            stylist_id: targetStylistId,
          },
        })
      } else {
        updatedBooking = await rescheduleClient({
          bookingId: booking.id,
          body: {
            starts_at: isoStartsAt,
            ends_at: isoEndsAt,
            stylist_id: targetStylistId,
          },
        }).unwrap()
      }

      toast.success(
        'Appointment successfully modified! Your deposit hold has been transferred.',
        toastColor.success,
      )
      onSuccess?.(updatedBooking)
      onClose()
    } catch (err: unknown) {
      const detail =
        (err as { data?: { detail?: string } })?.data?.detail ||
        (err as Error)?.message ||
        'Failed to reschedule appointment. Please check availability.'
      setErrorMessage(detail)
      toast.error(detail, toastColor.error)
    }
  }

  const rescheduleOrgBookingPayload = async (args: {
    bookingId: string
    body: { starts_at: string | null; ends_at: string | null; stylist_id?: string | null }
  }) => {
    return await rescheduleOrg(args).unwrap()
  }

  return (
    <CustomResponsiveDialog
      open={isOpen}
      setOpen={(openState) => {
        if (!openState) onClose()
      }}
      header={
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-700" />
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Reschedule / Change Stylist
            </h3>
          </div>
          <p className="text-stone-500 text-xs">
            Modify appointment schedule or reassign your stylist with automatic deposit hold
            preservation.
          </p>
        </div>
      }
      footer={
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row w-full sm:w-auto">
          <PrimaryButton
            variant="ghost"
            size="sm"
            className="h-10 cursor-pointer rounded-full px-4 text-xs sm:text-sm font-semibold transition-colors hover:bg-stone-100 text-stone-700"
            onClick={onClose}
            isDisabled={isSubmitting}
            title="Keep Current Booking"
            fullWidth={false}
          />
          <PrimaryButton
            variant="dark"
            size="sm"
            className="h-10 cursor-pointer rounded-full px-5 text-xs sm:text-sm font-semibold transition-all active:scale-[0.98]"
            onClick={handleSubmit}
            isDisabled={!canSubmit}
            isLoading={isSubmitting}
            title={isSubmitting ? 'Updating...' : 'Confirm Modifications'}
            fullWidth={false}
          />
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {/* Error alert banner */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-950">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Time Restriction Cutoff Banner */}
        {isWithinCutoff && !isOrg ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-950">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900">Self-Service Rescheduling Window Closed</p>
              <p className="mt-1 leading-relaxed text-rose-800">
                Rescheduling or changing stylists is restricted within {cutoffHours} hours of your
                appointment start time (starts in {Math.max(0, hoursUntilStart).toFixed(1)}h).
                Please call {booking.salonName || 'the salon'} directly to arrange immediate
                adjustments.
              </p>
            </div>
          </div>
        ) : isWithinCutoff && isOrg ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-sky-200 bg-sky-50/80 p-3 text-xs text-sky-950">
            <ShieldCheck className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
            <div>
              <span className="font-semibold text-sky-900">Staff Override Authorized:</span>
              <span className="ml-1 text-sky-800">
                You are modifying this appointment within the salon&apos;s {cutoffHours}-hour cutoff
                window on behalf of the client.
              </span>
            </div>
          </div>
        ) : null}

        {/* Existing Appointment Summary Card */}
        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-900">{booking.serviceName}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
              <Lock className="h-3 w-3 text-amber-600" />
              <span>Held {formatUsd(booking.holdAmount)}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-stone-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-stone-400" />
              <span>Current: {booking.appointmentTime}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-stone-400" />
              <span>Stylist: {booking.stylistName || 'Any Available'}</span>
            </span>
          </div>
        </div>

        {/* Date & Time Selector */}
        <div className="space-y-1.5">
          <label htmlFor={dateInputId} className="block text-xs font-semibold text-stone-900">
            New Appointment Date & Time
          </label>
          <div className="relative">
            <input
              id={dateInputId}
              type="datetime-local"
              value={selectedDateTime}
              min={minDateTime}
              max={maxDateTime}
              onChange={(e) => setSelectedDateTime(e.target.value)}
              disabled={isSubmitting || (!isOrg && isWithinCutoff)}
              className={cn(
                'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs transition-colors',
                'focus:border-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900',
                'disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed',
                isPastMaxCutoff && 'border-amber-500 bg-amber-50/40 text-amber-950',
              )}
            />
          </div>
          <p className="text-[11px] text-stone-500">
            Estimated duration: {booking.durationMin || 60} mins based on your selected service.
          </p>
        </div>

        {/* PayPal 29-Day Hard Ceiling Reschedule Warning Banner */}
        {isPastMaxCutoff && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
              <span>Reschedule Limit Exceeded</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-900">
              Reschedule Limit: This deposit hold expires on{' '}
              <strong>{format(rescheduleMaxDate, 'MMM d, yyyy')}</strong> (29 days from booking). To
              schedule beyond this date, please release this hold and book a new appointment.
            </p>
          </div>
        )}

        {/* Stylist Selector */}
        <div className="space-y-1.5">
          <label htmlFor={stylistSelectId} className="block text-xs font-semibold text-stone-900">
            Assign Stylist
          </label>
          {isLoadingStaff ? (
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs text-stone-500">
              <Users className="h-4 w-4 animate-spin text-stone-400" />
              <span>Loading available stylists...</span>
            </div>
          ) : (
            <select
              id={stylistSelectId}
              value={selectedStylistId}
              onChange={(e) => setSelectedStylistId(e.target.value)}
              disabled={isSubmitting || (!isOrg && isWithinCutoff)}
              className={cn(
                'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs transition-colors',
                'focus:border-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900',
                'disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed',
              )}
            >
              <option value="">Any Available Stylist</option>
              {staffMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.display_name} {member.role ? `(${member.role})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* PayPal Hold & Fintech Explanatory Banner */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3.5 text-xs text-emerald-950 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-emerald-900">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <span>Fintech Hold Guarantee: $0 Charged Today</span>
          </div>
          <p className="leading-relaxed text-emerald-800 text-[11px]">
            Your PayPal authorization hold of{' '}
            <strong className="text-emerald-950 font-bold">{formatUsd(booking.holdAmount)}</strong>{' '}
            automatically transfers to your new appointment slot. Settlement routes to the
            organization&apos;s verified PayPal merchant account at checkout. No new charge or
            double authorization is initiated.
          </p>
          <p className="leading-relaxed text-stone-600 text-[11px] pt-1 border-t border-emerald-200/50">
            <strong>Duration & Price Guardrail:</strong> If you add services or extend duration
            exceeding your original hold ceiling ({formatUsd(booking.holdAmount)}), the remaining
            balance is settled in-person at checkout.
          </p>
        </div>
      </div>
    </CustomResponsiveDialog>
  )
}
