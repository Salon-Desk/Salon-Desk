'use client'

import { addDays, differenceInDays, format } from 'date-fns'
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Info,
  Lock,
  Percent,
  Phone,
  Receipt,
  RefreshCw,
  Scale,
  Scissors,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { RescheduleBookingDialog } from '@/app/client/_components/RescheduleBookingDialog'
import { PrimaryButton } from '@/components/button'
import { RichText } from '@/components/chat/RichText'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { CustomDrawer } from '@/components/drawer/CustomDrawer'
import { Badge, HoldStateBadge } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { formatBookingRef, formatDuration, formatUsd, isPlaceholderValue } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  useGetBookingWaitlistQuery,
  useRescueSlotMutation,
  useSimulateDisputeMutation,
} from '@/store/api/disputeApi'
import type { Booking } from '@/types'
import type { SlotRescueResponse } from '@/types/dispute'

export interface SettlementDrawerProps {
  booking: Booking
  isSettlementProcessing: boolean
  onClose: () => void
  onMarkShow: (booking: Booking) => void
  onMarkNoShow: (booking: Booking) => void
  onCancelAndVoid: (booking: Booking) => void
  onReauthorizeHold: (booking: Booking) => void
}

type ActionConfirmation = 'SHOW' | 'NO_SHOW' | 'VOID' | 'REAUTH' | null

export function SettlementDrawer({
  booking,
  isSettlementProcessing,
  onClose,
  onMarkShow,
  onMarkNoShow,
  onCancelAndVoid,
  onReauthorizeHold,
}: SettlementDrawerProps) {
  const [pendingConfirmation, setPendingConfirmation] = useState<ActionConfirmation>(null)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  // PayPal authorization hold lifecycle calculations
  const holdAuthorizedAt = useMemo(() => {
    const raw = booking.paymentHold?.authorizedAt || booking.authorizedAt || booking.createdAt
    if (!raw) return new Date()
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? new Date() : d
  }, [booking])

  const now = useMemo(() => new Date(), [])
  const daysOld = useMemo(() => differenceInDays(now, holdAuthorizedAt), [now, holdAuthorizedAt])
  const rescheduleMaxDate = useMemo(() => addDays(holdAuthorizedAt, 28), [holdAuthorizedAt])

  // Slot Rescue State & RTK Query Hooks
  const [selectedWaitlistId, setSelectedWaitlistId] = useState<string | null>(null)
  const [rescueResult, setRescueResult] = useState<SlotRescueResponse | null>(null)
  const [showRescueRounds, setShowRescueRounds] = useState<boolean>(true)
  const [showRescuePanel, setShowRescuePanel] = useState<boolean>(false)

  const { data: waitlistEntries = [], isLoading: isLoadingWaitlist } = useGetBookingWaitlistQuery(
    booking.id,
    { skip: !booking.id },
  )
  const [rescueSlotMutation, { isLoading: isRescuing }] = useRescueSlotMutation()
  const [simulateDispute, { isLoading: isSimulatingDispute }] = useSimulateDisputeMutation()
  const router = useRouter()

  const handleSimulateDispute = async () => {
    try {
      await simulateDispute({
        bookingId: booking.id,
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        dispute_amount: booking.noShowFee || 30.0,
      }).unwrap()
      toast.success('Dispute chargeback simulated! Opening Dispute Counsel...', toastColor.success)
      onClose()
      router.push('/merchant/disputes')
    } catch {
      onClose()
      router.push('/merchant/disputes')
    }
  }

  const handleExecuteRescue = async () => {
    try {
      const result = await rescueSlotMutation({
        bookingId: booking.id,
        waitlist_entry_id: selectedWaitlistId || undefined,
      }).unwrap()
      setRescueResult(result)
      toast.success(
        `Slot Rescued! Refilled with ${result.replacement_client_name}. Fee ${result.action.toLowerCase()}.`,
        toastColor.success,
      )
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { detail?: string } })?.data?.detail || 'Failed to execute slot rescue'
      toast.error(errorMsg, toastColor.error)
    }
  }

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleConfirmAction = async () => {
    if (!pendingConfirmation) return
    const action = pendingConfirmation
    try {
      if (action === 'SHOW') {
        await onMarkShow(booking)
      } else if (action === 'NO_SHOW') {
        await onMarkNoShow(booking)
      } else if (action === 'VOID') {
        await onCancelAndVoid(booking)
      } else if (action === 'REAUTH') {
        await onReauthorizeHold(booking)
      }
      setPendingConfirmation(null)
    } catch {
      // Handled by parent toast/error handler
    }
  }

  const isCaptured = booking.status === 'CAPTURED'
  const isNoShowCaptured = booking.status === 'NO_SHOW_CAPTURED'
  const isVoided = booking.status === 'VOIDED'
  const isRefunded =
    booking.status === 'REFUNDED' || (booking.refundAmount != null && booking.refundAmount > 0)
  const isSettled = isCaptured || isNoShowCaptured || isVoided || isRefunded

  // Check if the appointment time has passed in the organization's timezone
  const canSettle = (() => {
    if (!booking.startsAt) return false
    try {
      const appointmentTime = new Date(booking.startsAt)
      const now = new Date()
      // If organization timezone is available, convert the appointment time to that timezone
      // and compare with current time in that timezone
      if (booking.organizationTimezone) {
        const appointmentTimeInTz = new Date(
          appointmentTime.toLocaleString('en-US', { timeZone: booking.organizationTimezone }),
        )
        const nowInTz = new Date(
          now.toLocaleString('en-US', { timeZone: booking.organizationTimezone }),
        )
        return nowInTz >= appointmentTimeInTz
      }
      // Fallback: compare UTC times directly
      return now >= appointmentTime
    } catch {
      // If date parsing fails, allow settlement
      return true
    }
  })()

  const clientInitials =
    booking.clientName
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CL'

  // Commission calculations from booking.commissionSnapshot
  const commissionSnapshot = (booking.commissionSnapshot || {}) as Record<string, unknown>
  const pct =
    commissionSnapshot.percentage != null
      ? Number(commissionSnapshot.percentage)
      : commissionSnapshot.rate_percent != null
        ? Number(commissionSnapshot.rate_percent)
        : null
  const flat = commissionSnapshot.flat != null ? Number(commissionSnapshot.flat) : null
  const explicitAmount =
    commissionSnapshot.amount != null ? Number(commissionSnapshot.amount) : null

  const baseGrossForCommission = isCaptured
    ? booking.servicePrice
    : isNoShowCaptured
      ? booking.noShowFee
      : booking.servicePrice

  const calculatedCommission =
    explicitAmount != null && explicitAmount > 0
      ? explicitAmount
      : pct != null
        ? Math.round(((baseGrossForCommission * pct) / 100 + (flat || 0)) * 100) / 100
        : flat != null
          ? flat
          : Math.round(baseGrossForCommission * 0.018 * 100) / 100 // fallback 1.8%

  const estimatedNetSalonRevenue = Math.max(0, baseGrossForCommission - calculatedCommission)
  const salonRetentionPercent =
    baseGrossForCommission > 0
      ? ((estimatedNetSalonRevenue / baseGrossForCommission) * 100).toFixed(1)
      : '98.2'

  const commissionRateLabel =
    pct != null ? `${pct.toFixed(1)}%` : flat != null ? formatUsd(flat) : '1.8%'

  const commissionTypeLabel =
    typeof commissionSnapshot.type === 'string'
      ? commissionSnapshot.type.charAt(0).toUpperCase() +
        commissionSnapshot.type.slice(1).toLowerCase()
      : pct != null
        ? 'Percentage'
        : 'Platform SaaS'

  return (
    <>
      {/* 1. Main Appointment Settlement Details Drawer */}
      <CustomDrawer
        open={true}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
        classNameContent="sm:max-w-2xl sm:w-[580px] md:w-[640px] lg:w-[680px] w-full"
        direction="right"
        header={
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
              <Scissors className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-900 text-base truncate">Appointment Payment</h3>
              <p className="font-mono text-xs text-slate-500 truncate">
                Ref #{booking.id.slice(0, 8)}
              </p>
            </div>
          </div>
        }
        footer={
          isSettled ? (
            <div className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {isCaptured && 'Payment Complete — Full Amount Charged'}
                    {isNoShowCaptured && 'Payment Complete — No-Show Fee Charged'}
                    {isVoided && 'Appointment Cancelled — Payment Released'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate sm:whitespace-normal">
                    No further action needed for this appointment.
                  </div>
                </div>
              </div>
              <PrimaryButton
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="h-10 shrink-0 rounded-xl px-4 text-xs"
                title="Close"
                fullWidth={false}
              />
            </div>
          ) : (
            <div className="w-full space-y-2">
              {!canSettle && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Payment actions available after appointment time
                    {booking.appointmentTime ? ` (${booking.appointmentTime})` : ''}
                  </span>
                </div>
              )}

              {/* Primary Action Button */}
              <PrimaryButton
                variant="success"
                fullWidth
                isDisabled={isSettlementProcessing || !canSettle}
                onClick={() => setPendingConfirmation('SHOW')}
                className="h-10 justify-between rounded-xl px-4 text-xs font-bold shadow-none"
              >
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Mark Show &amp; Capture
                </span>
                <span className="font-mono text-xs font-extrabold bg-emerald-700/40 px-2 py-0.5 rounded-md">
                  {formatUsd(booking.servicePrice)}
                </span>
              </PrimaryButton>

              {/* Secondary Actions Row */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2">
                <PrimaryButton
                  variant="secondary"
                  isDisabled={isSettlementProcessing || !canSettle}
                  onClick={() => setPendingConfirmation('NO_SHOW')}
                  className="rounded-xl text-xs font-medium h-9 px-3 justify-center text-rose-700 border-rose-200/80 hover:bg-rose-50/80"
                  icon={<AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-rose-600" />}
                  title={`No-Show (${formatUsd(booking.noShowFee)})`}
                  fullWidth
                />

                <PrimaryButton
                  variant="secondary"
                  isDisabled={isSettlementProcessing || !canSettle}
                  onClick={() => setPendingConfirmation('VOID')}
                  className="rounded-xl text-xs font-medium h-9 px-3 justify-center text-slate-600 hover:text-slate-900"
                  icon={<XCircle className="h-3.5 w-3.5 mr-1.5 text-slate-400" />}
                  title="Cancel & Void ($0)"
                  fullWidth
                />
              </div>

              {/* Reauthorize & Reschedule options if within valid window */}
              {(booking.status === 'HELD' || booking.status === 'REAUTHORIZED') && (
                <div className="pt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
                  {daysOld >= 29 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
                      <Lock className="h-3 w-3 text-rose-500" />
                      Hold Expired
                    </span>
                  ) : daysOld < 3 ? (
                    <div
                      className="inline-flex items-center gap-1.5"
                      title="Guaranteed active (Honor period active until Day 4)"
                    >
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 cursor-not-allowed"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Reauthorize Hold</span>
                      </button>
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200">
                        Guaranteed active (Honor period active until Day 4)
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={
                          isSettlementProcessing ||
                          booking.status === 'REAUTHORIZED' ||
                          (booking.reauthorizationCount ?? 0) >= 1
                        }
                        onClick={() => setPendingConfirmation('REAUTH')}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-700 hover:text-sky-900 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                        title={
                          booking.status === 'REAUTHORIZED' ||
                          (booking.reauthorizationCount ?? 0) >= 1
                            ? 'Payment extended (Max 1)'
                            : 'Eligible for Renewal'
                        }
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>
                          {booking.status === 'REAUTHORIZED' ||
                          (booking.reauthorizationCount ?? 0) >= 1
                            ? 'Payment extended (Max 1)'
                            : 'Reauthorize Hold'}
                        </span>
                      </button>
                      {daysOld >= 4 &&
                        daysOld < 29 &&
                        booking.status !== 'REAUTHORIZED' &&
                        (booking.reauthorizationCount ?? 0) < 1 && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-200">
                            Eligible for Renewal
                          </span>
                        )}
                    </div>
                  )}

                  <span className="text-slate-300 text-xs hidden sm:inline">·</span>

                  <button
                    type="button"
                    disabled={isSettlementProcessing}
                    onClick={() => setShowRescheduleDialog(true)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-800 hover:text-amber-950 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    <Calendar className="h-3 w-3 text-amber-700" />
                    <span>Reschedule / Change Stylist</span>
                  </button>
                </div>
              )}

              {daysOld >= 28 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-950 flex items-start gap-2 text-left mt-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Reschedule Limit: This deposit hold expires on{' '}
                    <strong>{format(rescheduleMaxDate, 'MMM d, yyyy')}</strong> (29 days from
                    booking). To schedule beyond this date, please release this hold and book a new
                    appointment.
                  </p>
                </div>
              )}
            </div>
          )
        }
      >
        <div className="space-y-4">
          {/* Status & Booking Reference Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-slate-200/70 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/60 p-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-600">Payment Status:</span>
              {rescueResult ? (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {rescueResult.action === 'REFUNDED' ? 'REFUNDED (RESCUED)' : 'VOIDED (RESCUED)'}
                </span>
              ) : (
                <HoldStateBadge status={booking.status} />
              )}
            </div>
            <div className="flex items-center gap-1 font-mono text-xs font-medium text-slate-500 self-start sm:self-auto">
              <span>#{booking.id.slice(0, 8)}</span>
              <button
                type="button"
                onClick={() => handleCopy(booking.id, 'id')}
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                title="Copy ID"
              >
                {copiedKey === 'id' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Client & Service Summary Card */}
          <div className="space-y-3.5 rounded-2xl border border-slate-200/70 bg-white p-4">
            {/* Client Row */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700 border border-slate-200">
                {clientInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-slate-900 truncate">
                  {booking.clientName || 'Client'}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 truncate mt-0.5">
                  <span>{booking.clientEmail || 'No email'}</span>
                  {booking.clientPhone && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="h-2.5 w-2.5" />
                        {booking.clientPhone}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Service, Stylist & Appointment Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Service</span>
                <div className="font-semibold text-slate-900 truncate">{booking.serviceName}</div>
                <div className="text-[11px] text-amber-800 font-medium mt-0.5">
                  with {booking.stylistName || 'Assigned Stylist'}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-400 block mb-0.5">
                  Date &amp; Time
                </span>
                <div className="flex items-center gap-1 font-medium text-slate-800">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{booking.appointmentTime || 'Scheduled'}</span>
                </div>
                {booking.durationMin ? (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                    <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>{formatDuration(booking.durationMin)}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Customer notes if present */}
          {booking.customerNotes ? (
            <div className="flex items-start gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3.5 py-2.5 text-slate-700 text-xs">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <span className="font-semibold text-slate-900 block text-[11px]">Client Note</span>
                <p className="text-slate-600 mt-0.5 leading-relaxed">{booking.customerNotes}</p>
              </div>
            </div>
          ) : null}

          {/* 1. Well-Formatted Financial Information & Receipt Breakdown Card */}
          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <Receipt className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Financial &amp; Receipt Breakdown
                </span>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border',
                  isRefunded
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : isCaptured
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : isNoShowCaptured
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : isVoided
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200',
                )}
              >
                <Check className="h-2.5 w-2.5" />
                {isRefunded && `Refund Issued (${formatUsd(booking.refundAmount ?? 0)})`}
                {!isRefunded && isCaptured && 'Settled in Full'}
                {!isRefunded && isNoShowCaptured && 'No-Show Fee Captured'}
                {!isRefunded && isVoided && 'Released · $0 Charged'}
                {!isRefunded && !isSettled && '$0 Charged Upfront'}
              </span>
            </div>

            {/* Price & Hold Highlights */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs">
                <span className="text-[11px] font-medium text-slate-500 block mb-1">
                  Service Price
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                  {formatUsd(booking.servicePrice)}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Full appointment total
                </span>
              </div>

              <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 shadow-2xs">
                <span className="text-[11px] font-medium text-amber-900 block mb-1">
                  Reserved Deposit Hold
                </span>
                <div className="text-xl font-bold font-mono text-amber-900 tabular-nums">
                  {formatUsd(booking.holdAmount)}
                </div>
                <span className="text-[10px] text-amber-700 mt-0.5 block">
                  Locked PayPal pre-approval
                </span>
              </div>
            </div>

            {/* Itemized Receipt Line Items (matching Client Receipt Dialog) */}
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-600">Client Charged at Booking</span>
                <span className="font-semibold text-emerald-700 font-mono">{formatUsd(0)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-600">Agreed No-Show Fee</span>
                <span className="font-semibold text-rose-700 font-mono">
                  {formatUsd(booking.noShowFee)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-600">Late Cancellation Fee</span>
                <span className="font-semibold text-rose-700 font-mono">
                  {formatUsd(booking.lateCancelFee)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-600">Free Cancellation Until</span>
                <span className="font-medium text-slate-900">
                  {booking.freeCancelDeadlineLabel || booking.authExpiresAt || 'Standard Policy'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-700 pt-1.5 border-t border-amber-200/60">
                <span className="text-slate-600">
                  Platform Software Fee ({commissionRateLabel})
                </span>
                <span className="font-semibold text-slate-700 font-mono">
                  {formatUsd(calculatedCommission)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-900 font-medium">
                <span className="text-slate-700 font-semibold">Est. Net Salon Revenue</span>
                <span className="font-bold text-emerald-800 font-mono">
                  {formatUsd(estimatedNetSalonRevenue)}
                </span>
              </div>

              {booking.cancellationFeeCharged != null && booking.cancellationFeeCharged > 0 && (
                <div className="flex items-center justify-between text-rose-800 font-medium pt-1.5 border-t border-rose-200/60">
                  <span>Cancellation Penalty Charged</span>
                  <span className="font-mono font-bold">
                    {formatUsd(booking.cancellationFeeCharged)}
                  </span>
                </div>
              )}

              {isCaptured && (
                <div className="flex items-center justify-between text-emerald-800 font-medium pt-1.5 border-t border-emerald-200/60">
                  <span>Captured to Merchant Account</span>
                  <span className="font-mono font-bold">{formatUsd(booking.servicePrice)}</span>
                </div>
              )}

              {isNoShowCaptured && (
                <div className="flex items-center justify-between text-rose-800 font-medium pt-1.5 border-t border-rose-200/60">
                  <span>No-Show Penalty Captured</span>
                  <span className="font-mono font-bold">{formatUsd(booking.noShowFee)}</span>
                </div>
              )}

              {isVoided && (
                <div className="flex items-center justify-between text-slate-600 font-medium pt-1.5 border-t border-slate-200/60">
                  <span>Final Charged Amount</span>
                  <span className="font-mono font-bold text-slate-800">{formatUsd(0)}</span>
                </div>
              )}

              {isRefunded && (
                <div className="flex items-center justify-between text-purple-800 font-medium pt-1.5 border-t border-purple-200/60">
                  <span className="flex items-center gap-1.5">
                    <span>Refund Executed</span>
                    {booking.refundId && (
                      <span className="font-mono text-[10px] text-purple-600">
                        ({booking.refundId})
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-purple-700">
                    -{formatUsd(booking.refundAmount ?? 0)}
                  </span>
                </div>
              )}
            </div>

            {/* Explainer Note */}
            <p className="text-[11px] text-amber-900/80 leading-relaxed bg-amber-100/40 rounded-xl p-2.5 border border-amber-200/50">
              <span className="font-semibold">Direct PayPal settlement:</span> Zero dollars debited
              upfront. Funds are pre-authorized on the client&apos;s card and captured directly into
              your salon&apos;s PayPal merchant account upon service completion or verified no-show.
            </p>
          </div>

          {/* 2. Platform Commission & Net Payout Card */}
          <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <Percent className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Platform Commission &amp; Net Payout
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-800">
                {commissionRateLabel} Take-Rate
              </span>
            </div>

            {/* Net Salon vs Commission 2-col tiles */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3 shadow-2xs">
                <span className="text-[11px] font-medium text-emerald-900 block mb-1">
                  Est. Net Salon Revenue
                </span>
                <div className="text-xl font-bold font-mono text-emerald-950 tabular-nums">
                  {formatUsd(estimatedNetSalonRevenue)}
                </div>
                <span className="text-[10px] text-emerald-700 mt-0.5 block">
                  {salonRetentionPercent}% retention rate
                </span>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs">
                <span className="text-[11px] font-medium text-slate-500 block mb-1">
                  Platform SaaS Fee
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                  {formatUsd(calculatedCommission)}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Billed on periodic SaaS invoice
                </span>
              </div>
            </div>

            {/* Commission details rows */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Commission Rule</span>
                <span className="font-semibold text-slate-900">
                  {commissionTypeLabel} ({commissionRateLabel})
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Gross Settlement Base</span>
                <span className="font-mono font-medium text-slate-800">
                  {formatUsd(baseGrossForCommission)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Payout Model</span>
                <span className="font-medium text-emerald-700">100% Direct to Salon PayPal</span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Ledger Accrual Status</span>
                <span className="font-medium text-slate-800">
                  {isSettled ? 'Accrued to Ledger' : 'Pending Capture'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-indigo-950/80 leading-relaxed bg-indigo-100/40 rounded-xl p-2.5 border border-indigo-200/50">
              <span className="font-semibold">Transparent SaaS Billing:</span> 100% of the
              client&apos;s payment flows directly to your PayPal account. SalonDesk does not
              withhold commissions at checkout; fees accrue in your double-entry ledger and are
              billed via consolidated statements.
            </p>
          </div>

          {/* Audit / Settlement Notes (if any) */}
          {booking.settlementNote && (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-700">
              <span className="font-semibold text-slate-900 block mb-1">Settlement Audit:</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">{booking.settlementNote}</p>
            </div>
          )}

          {/* Slot Rescue & Waitlist Refill Panel */}
          {Boolean(isNoShowCaptured || isVoided || rescueResult || showRescuePanel) && (
            <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-indigo-50/30 p-4 space-y-3.5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="truncate">Slot Rescue &amp; Waitlist Refill</span>
                      <span className="rounded-md bg-indigo-100/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-800 shrink-0">
                        Referee AI
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate sm:whitespace-normal">
                      Autonomous waitlist refill &amp; penalty relief
                    </p>
                  </div>
                </div>
                {rescueResult && (
                  <div className="shrink-0 self-start sm:self-auto">
                    <Badge tone="emerald" dot>
                      Slot Refilled
                    </Badge>
                  </div>
                )}
              </div>

              {rescueResult ? (
                /* Successful Rescue Result View */
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Chair Successfully Refilled</span>
                      </span>
                      <span className="font-mono text-[11px] font-extrabold text-emerald-800 self-start sm:self-auto">
                        {rescueResult.action === 'REFUNDED' ? 'FEE REFUNDED' : 'HOLD VOIDED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="rounded-lg bg-white/80 p-2 border border-emerald-100 min-w-0">
                        <span className="text-[10px] text-slate-400 block truncate">
                          Replacement Client
                        </span>
                        <span className="font-bold text-slate-900 truncate block">
                          {rescueResult.replacement_client_name}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 truncate block">
                          #{rescueResult.replacement_booking_id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="rounded-lg bg-white/80 p-2 border border-emerald-100 min-w-0">
                        <span className="text-[10px] text-slate-400 block truncate">
                          {rescueResult.action === 'REFUNDED' ? 'Refund Amount' : 'Waived Penalty'}
                        </span>
                        <span className="font-mono font-bold text-emerald-800 block truncate">
                          {formatUsd(
                            Number(rescueResult.refund_amount || rescueResult.waived_amount),
                          )}
                        </span>
                        <span className="text-[10px] text-emerald-600 block truncate">
                          PayPal auto-settled
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3-Round Negotiation Transcript */}
                  <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowRescueRounds(!showRescueRounds)}
                      className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Scale className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">3-Round Referee Negotiation Log</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200',
                          showRescueRounds && 'rotate-180',
                        )}
                      />
                    </button>

                    {showRescueRounds && (
                      <div className="p-3 border-t border-slate-100 space-y-2.5 bg-slate-50/50">
                        {rescueResult.negotiation_rounds?.map((rnd) => (
                          <div
                            key={rnd.round}
                            className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs space-y-1"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-mono font-bold text-slate-600">
                                  {rnd.round}
                                </span>
                                <span className="truncate">{rnd.role}</span>
                              </span>
                              {rnd.verdict && (
                                <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 self-start sm:self-auto">
                                  {rnd.verdict}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 leading-relaxed break-words">
                              <RichText content={rnd.english} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Unrescued State — Candidate selection & Trigger button */
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This chair was vacated due to cancellation or no-show. The referee agent can
                    refill it with a matching waitlisted client, and automatically void or refund
                    the penalty hold to maintain customer trust.
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        Matching Waitlist Queue
                      </span>
                      <span className="font-mono text-slate-400">
                        {isLoadingWaitlist ? 'Checking...' : `${waitlistEntries.length} Available`}
                      </span>
                    </div>

                    {isLoadingWaitlist ? (
                      <div className="flex items-center justify-center py-4 text-xs text-slate-400 gap-2">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Searching waitlist candidates…</span>
                      </div>
                    ) : waitlistEntries.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {waitlistEntries.map((candidate) => {
                          const isSelected =
                            selectedWaitlistId === candidate.id ||
                            (!selectedWaitlistId && candidate.id === waitlistEntries[0].id)
                          return (
                            <div
                              key={candidate.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedWaitlistId(candidate.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  setSelectedWaitlistId(candidate.id)
                                }
                              }}
                              className={cn(
                                'flex items-center justify-between rounded-xl border p-2.5 text-xs transition-colors cursor-pointer',
                                isSelected
                                  ? 'border-indigo-400 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-400'
                                  : 'border-slate-200 bg-white hover:bg-slate-50',
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-slate-900 truncate">
                                  {candidate.client_name}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {candidate.client_email}
                                </div>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                                  <Clock className="h-2.5 w-2.5" />
                                  {new Date(candidate.preferred_starts_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 p-3 text-center text-xs text-slate-500">
                        <p>No waiting candidates currently queueing for {booking.serviceName}.</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Referee will allocate the next available waitlist match.
                        </p>
                      </div>
                    )}
                  </div>

                  <PrimaryButton
                    id="agent-slot-rescue-btn"
                    variant="primary"
                    fullWidth
                    isDisabled={isRescuing}
                    isLoading={isRescuing}
                    onClick={handleExecuteRescue}
                    className="h-10 rounded-xl text-xs font-bold shadow-none bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Rescue Slot &amp; Refill from Waitlist
                    </span>
                  </PrimaryButton>
                </div>
              )}
            </div>
          )}

          {/* If booking is not no-show/voided, provide simulation toggle */}
          {!isNoShowCaptured && !isVoided && !rescueResult && !showRescuePanel && (
            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={() => setShowRescuePanel(true)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Simulate Slot Rescue &amp; Waitlist Refill</span>
              </button>
            </div>
          )}

          {/* 2. Payment Reference & Guarantee Card (Human-Readable for Non-Technical Users) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Payment Reference &amp; Guarantee
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                <Lock className="h-2.5 w-2.5 text-slate-500" />
                Protected
              </span>
            </div>

            {/* Friendly Non-Technical Guarantee Banner */}
            <div
              className={cn(
                'flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed',
                isCaptured
                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                  : isNoShowCaptured
                    ? 'border-amber-200 bg-amber-50/70 text-amber-950'
                    : isVoided
                      ? 'border-slate-200 bg-slate-50 text-slate-800'
                      : 'border-sky-200 bg-sky-50/70 text-sky-950',
              )}
            >
              {isCaptured ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : isNoShowCaptured ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              ) : isVoided ? (
                <XCircle className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
              ) : (
                <ShieldCheck className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs">
                  {isCaptured && 'Payment Captured & Deposited'}
                  {isNoShowCaptured && 'No-Show Fee Captured & Deposited'}
                  {isVoided && 'Appointment Cancelled — Payment Hold Released'}
                  {!isSettled && 'Pre-Authorized Payment Guarantee Active'}
                </div>
                <div className="text-[11px] opacity-85 mt-0.5">
                  {isCaptured &&
                    `Full payment of ${formatUsd(booking.servicePrice)} has been deposited into your salon's PayPal merchant account.`}
                  {isNoShowCaptured &&
                    `Agreed no-show fee of ${formatUsd(booking.noShowFee)} has been captured and deposited into your PayPal account.`}
                  {isVoided &&
                    'The reservation was cancelled and the authorization hold was released with $0 charged.'}
                  {!isSettled &&
                    `A deposit of ${formatUsd(booking.holdAmount)} is locked on the client's PayPal payment method, ensuring guaranteed payment when service completes.`}
                </div>
              </div>
            </div>

            {/* Dispute Counsel Test Action */}
            {isNoShowCaptured && (
              <div className="flex items-center justify-between rounded-xl border border-indigo-200/80 bg-indigo-50/60 p-3 text-xs text-indigo-950">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
                    <Scale className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 truncate">
                      Dispute Counsel Defense
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Simulate customer PayPal chargeback &amp; test AI rebuttals
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="agent-dispute-btn"
                  disabled={isSimulatingDispute}
                  onClick={handleSimulateDispute}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer shrink-0 ml-2 disabled:opacity-50"
                >
                  {isSimulatingDispute ? 'Simulating...' : 'Simulate Dispute →'}
                </button>
              </div>
            )}

            {/* Human-Readable Reference Details */}
            <div className="space-y-2.5 text-xs divide-y divide-slate-100">
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                  PayPal (Zero-Charge Authorization Hold)
                </span>
              </div>

              <div className="flex items-center justify-between pt-2.5">
                <span className="text-slate-500">PayPal Reference #</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-semibold text-slate-900">
                    {!isPlaceholderValue(booking.paypalAuthId)
                      ? booking.paypalAuthId
                      : booking.paypalOrderId && !isPlaceholderValue(booking.paypalOrderId)
                        ? booking.paypalOrderId
                        : `SD-AUTH-${formatBookingRef(booking.id)}`}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        !isPlaceholderValue(booking.paypalAuthId)
                          ? booking.paypalAuthId
                          : booking.paypalOrderId || `SD-AUTH-${formatBookingRef(booking.id)}`,
                        'paypal_ref',
                      )
                    }
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Copy PayPal Reference"
                  >
                    {copiedKey === 'paypal_ref' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {booking.refundId ? (
                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-slate-500">PayPal Refund ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold text-purple-700">
                      {booking.refundId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(booking.refundId!, 'paypal_refund')}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Copy PayPal Refund Reference"
                    >
                      {copiedKey === 'paypal_refund' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-2.5">
                <span className="text-slate-500">Booking Confirmation Ref</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-semibold text-slate-900">
                    SD-{formatBookingRef(booking.id)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`SD-${formatBookingRef(booking.id)}`, 'booking_ref')}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Copy Booking Confirmation Ref"
                  >
                    {copiedKey === 'booking_ref' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5">
                <span className="text-slate-500">Client Terms Agreement</span>
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700 text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Digitally Agreed at Checkout
                </span>
              </div>

              <div className="flex items-center justify-between pt-2.5">
                <span className="text-slate-500">Protection Window</span>
                <span className="font-medium text-slate-800 text-[11px]">
                  {booking.honorExpiresLabel || 'Standard 72-Hour PayPal Guarantee'}
                </span>
              </div>
            </div>

            {/* Collapsible Technical Identifiers (For PayPal Support or Platform Audit) */}
            <div className="pt-1.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full flex items-center justify-between py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Info className="h-3 w-3 text-slate-400" />
                  Technical &amp; Audit Codes (For Support)
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-slate-400 transition-transform duration-200',
                    showTechnicalDetails && 'rotate-180',
                  )}
                />
              </button>

              {showTechnicalDetails && (
                <div className="mt-2 rounded-xl bg-slate-50/80 p-3 space-y-2 font-mono text-[10px] text-slate-600 border border-slate-200/60 animate-in fade-in duration-150">
                  <p className="font-sans text-[10px] text-slate-500 leading-relaxed mb-2">
                    Use these technical codes if contacting PayPal Merchant Support or SalonDesk
                    dispute operations.
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="font-sans text-slate-500">Payment Reference Key:</span>
                    <span className="text-slate-700 truncate max-w-[170px]">
                      {booking.idempotencyKey || 'ACTIVE'}
                    </span>
                  </div>

                  {booking.consentHash && !isPlaceholderValue(booking.consentHash) && (
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-slate-500">Terms Signature Hash:</span>
                      <span className="text-slate-600 truncate max-w-[170px]">
                        {booking.consentHash}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CustomDrawer>

      {/* 2. Focused Confirmation Modal in CustomResponsiveDialog */}
      {pendingConfirmation ? (
        <CustomResponsiveDialog
          open={Boolean(pendingConfirmation)}
          setOpen={(isOpen) => {
            if (!isOpen && !isSettlementProcessing) {
              setPendingConfirmation(null)
            }
          }}
          classNameContent="sm:max-w-md"
          header={
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
                  pendingConfirmation === 'SHOW' &&
                    'bg-emerald-50 text-emerald-600 border-emerald-200/80',
                  pendingConfirmation === 'NO_SHOW' &&
                    'bg-rose-50 text-rose-600 border-rose-200/80',
                  pendingConfirmation === 'VOID' &&
                    'bg-slate-100 text-slate-700 border-slate-200/80',
                  pendingConfirmation === 'REAUTH' && 'bg-sky-50 text-sky-600 border-sky-200/80',
                )}
              >
                {pendingConfirmation === 'SHOW' && <Check className="h-5 w-5" />}
                {pendingConfirmation === 'NO_SHOW' && <AlertTriangle className="h-5 w-5" />}
                {pendingConfirmation === 'VOID' && <XCircle className="h-5 w-5" />}
                {pendingConfirmation === 'REAUTH' && <RefreshCw className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-base truncate">
                  {pendingConfirmation === 'SHOW' && 'Confirm Full Payment Capture'}
                  {pendingConfirmation === 'NO_SHOW' && 'Confirm No-Show Fee'}
                  {pendingConfirmation === 'VOID' && 'Confirm Cancellation & Release Payment'}
                  {pendingConfirmation === 'REAUTH' && 'Extend Payment Reservation'}
                </h3>
                <p className="font-mono text-xs text-slate-500 truncate">
                  Booking Ref #{booking.id.slice(0, 8)}
                </p>
              </div>
            </div>
          }
          footer={
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:justify-end">
              <PrimaryButton
                variant="secondary"
                size="sm"
                isDisabled={isSettlementProcessing}
                onClick={() => setPendingConfirmation(null)}
                className="rounded-xl text-xs h-10 px-4"
                title="Cancel"
                fullWidth={false}
              />

              {pendingConfirmation === 'SHOW' && (
                <PrimaryButton
                  variant="success"
                  size="sm"
                  isDisabled={isSettlementProcessing}
                  isLoading={isSettlementProcessing}
                  onClick={handleConfirmAction}
                  className="h-10 rounded-xl px-4 text-xs font-semibold shadow-none"
                  icon={
                    !isSettlementProcessing ? <Check className="h-3.5 w-3.5 mr-1" /> : undefined
                  }
                  title={
                    isSettlementProcessing
                      ? 'Capturing…'
                      : `Confirm Capture (${formatUsd(booking.servicePrice)})`
                  }
                  fullWidth={false}
                />
              )}

              {pendingConfirmation === 'NO_SHOW' && (
                <PrimaryButton
                  variant="danger"
                  size="sm"
                  isDisabled={isSettlementProcessing}
                  isLoading={isSettlementProcessing}
                  onClick={handleConfirmAction}
                  className="h-10 rounded-xl px-4 text-xs font-semibold shadow-none"
                  icon={
                    !isSettlementProcessing ? (
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    ) : undefined
                  }
                  title={
                    isSettlementProcessing
                      ? 'Processing…'
                      : `Confirm Penalty (${formatUsd(booking.noShowFee)})`
                  }
                  fullWidth={false}
                />
              )}

              {pendingConfirmation === 'VOID' && (
                <PrimaryButton
                  variant="dark"
                  size="sm"
                  isDisabled={isSettlementProcessing}
                  isLoading={isSettlementProcessing}
                  onClick={handleConfirmAction}
                  className="h-10 rounded-xl px-4 text-xs font-semibold shadow-none"
                  icon={
                    !isSettlementProcessing ? <XCircle className="h-3.5 w-3.5 mr-1" /> : undefined
                  }
                  title={isSettlementProcessing ? 'Releasing…' : 'Confirm Void ($0.00)'}
                  fullWidth={false}
                />
              )}

              {pendingConfirmation === 'REAUTH' && (
                <PrimaryButton
                  variant="primary"
                  size="sm"
                  isDisabled={isSettlementProcessing}
                  isLoading={isSettlementProcessing}
                  onClick={handleConfirmAction}
                  className="h-10 rounded-xl px-4 text-xs font-semibold shadow-none"
                  icon={
                    !isSettlementProcessing ? <RefreshCw className="h-3.5 w-3.5 mr-1" /> : undefined
                  }
                  title={isSettlementProcessing ? 'Extending…' : 'Confirm Extension'}
                  fullWidth={false}
                />
              )}
            </div>
          }
        >
          <div className="space-y-3.5 text-xs">
            <div
              className={cn(
                'rounded-xl border p-3.5 space-y-1.5',
                pendingConfirmation === 'SHOW' &&
                  'border-emerald-200 bg-emerald-50/60 text-emerald-950',
                pendingConfirmation === 'NO_SHOW' && 'border-rose-200 bg-rose-50/60 text-rose-950',
                pendingConfirmation === 'VOID' && 'border-slate-200 bg-slate-50 text-slate-900',
                pendingConfirmation === 'REAUTH' && 'border-sky-200 bg-sky-50/60 text-sky-950',
              )}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>Payment Action</span>
                <span className="font-mono text-[11px] font-bold">
                  {pendingConfirmation === 'SHOW' && `Capture ${formatUsd(booking.servicePrice)}`}
                  {pendingConfirmation === 'NO_SHOW' && `Capture ${formatUsd(booking.noShowFee)}`}
                  {pendingConfirmation === 'VOID' && 'Release $0.00'}
                  {pendingConfirmation === 'REAUTH' && 'Extend Hold'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {pendingConfirmation === 'SHOW' &&
                  `This will charge ${formatUsd(booking.servicePrice)} from the client's reserved payment and deposit it to your PayPal merchant account.`}
                {pendingConfirmation === 'NO_SHOW' &&
                  `This will charge the ${formatUsd(booking.noShowFee)} no-show fee and release the remaining reserved amount.`}
                {pendingConfirmation === 'VOID' &&
                  'This will release the full reserved amount. The client will not be charged anything.'}
                {pendingConfirmation === 'REAUTH' &&
                  'This will extend the payment reservation window by 72 hours so the hold does not expire.'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span>Client:</span>
                <span className="font-semibold text-slate-900">
                  {booking.clientName || 'Client'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Service:</span>
                <span className="font-medium text-slate-800">{booking.serviceName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Reserved Amount:</span>
                <span className="font-mono font-semibold text-amber-900">
                  {formatUsd(booking.holdAmount)}
                </span>
              </div>
            </div>
          </div>
        </CustomResponsiveDialog>
      ) : null}

      {showRescheduleDialog && (
        <RescheduleBookingDialog
          booking={booking}
          isOpen={showRescheduleDialog}
          isOrg={true}
          onClose={() => setShowRescheduleDialog(false)}
          onSuccess={() => {
            setShowRescheduleDialog(false)
            onClose()
          }}
        />
      )}
    </>
  )
}
