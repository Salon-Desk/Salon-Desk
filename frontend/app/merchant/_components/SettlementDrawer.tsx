'use client'

import { addDays, differenceInDays, format } from 'date-fns'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Phone,
  Scissors,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { RescheduleBookingDialog } from '@/components/dialog'
import { CustomDrawer } from '@/components/drawer/CustomDrawer'
import { HoldStateBadge } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { formatDuration, formatUsd } from '@/lib/format'
import { useGetBookingWaitlistQuery, useRescueSlotMutation } from '@/store/api/disputeApi'
import type { Booking } from '@/types'
import type { SlotRescueResponse } from '@/types/dispute'

import {
  type ActionConfirmation,
  PolicyBreakdownCard,
  SettlementActionButtons,
  SettlementConfirmDialog,
  SlotRescuePanel,
  TechnicalDetailsAccordion,
} from './settlement'

export interface SettlementDrawerProps {
  booking: Booking
  isSettlementProcessing: boolean
  onClose: () => void
  onMarkShow: (booking: Booking) => void
  onMarkNoShow: (booking: Booking) => void
  onCancelAndVoid: (booking: Booking) => void
  onReauthorizeHold: (booking: Booking) => void
}

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

  const canSettle = (() => {
    if (!booking.startsAt) return false
    try {
      const appointmentTime = new Date(booking.startsAt)
      const currentDate = new Date()
      if (booking.organizationTimezone) {
        const appointmentTimeInTz = new Date(
          appointmentTime.toLocaleString('en-US', { timeZone: booking.organizationTimezone }),
        )
        const nowInTz = new Date(
          currentDate.toLocaleString('en-US', { timeZone: booking.organizationTimezone }),
        )
        return nowInTz >= appointmentTimeInTz
      }
      return currentDate >= appointmentTime
    } catch {
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
          <div className="w-full">
            <SettlementActionButtons
              booking={booking}
              isSettled={isSettled}
              isCaptured={isCaptured}
              isNoShowCaptured={isNoShowCaptured}
              isVoided={isVoided}
              canSettle={canSettle}
              daysOld={daysOld}
              isSettlementProcessing={isSettlementProcessing}
              onClose={onClose}
              onSetPendingConfirmation={setPendingConfirmation}
              onOpenReschedule={() => setShowRescheduleDialog(true)}
            />
            {daysOld >= 28 && !isSettled && (
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
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
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

          {/* Policy & Commission Breakdown */}
          <PolicyBreakdownCard
            booking={booking}
            isSettled={isSettled}
            isCaptured={isCaptured}
            isNoShowCaptured={isNoShowCaptured}
            isVoided={isVoided}
            isRefunded={isRefunded}
            calculatedCommission={calculatedCommission}
            estimatedNetSalonRevenue={estimatedNetSalonRevenue}
            salonRetentionPercent={salonRetentionPercent}
            commissionRateLabel={commissionRateLabel}
            commissionTypeLabel={commissionTypeLabel}
            baseGrossForCommission={baseGrossForCommission}
          />

          {/* Audit / Settlement Notes (if any) */}
          {booking.settlementNote && (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-700">
              <span className="font-semibold text-slate-900 block mb-1">Settlement Audit:</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">{booking.settlementNote}</p>
            </div>
          )}

          {/* Slot Rescue & Waitlist Refill Panel */}
          <SlotRescuePanel
            booking={booking}
            rescueResult={rescueResult}
            showRescueRounds={showRescueRounds}
            onToggleRescueRounds={() => setShowRescueRounds(!showRescueRounds)}
            waitlistEntries={waitlistEntries}
            isLoadingWaitlist={isLoadingWaitlist}
            selectedWaitlistId={selectedWaitlistId}
            onSelectWaitlistId={setSelectedWaitlistId}
            isRescuing={isRescuing}
            onExecuteRescue={handleExecuteRescue}
            isNoShowCaptured={isNoShowCaptured}
            isVoided={isVoided}
            showRescuePanel={showRescuePanel}
            onShowRescuePanel={() => setShowRescuePanel(true)}
          />

          {/* Technical Details Accordion */}
          <TechnicalDetailsAccordion
            booking={booking}
            isCaptured={isCaptured}
            isNoShowCaptured={isNoShowCaptured}
            isVoided={isVoided}
            isSettled={isSettled}
            copiedKey={copiedKey}
            onCopy={handleCopy}
            showTechnicalDetails={showTechnicalDetails}
            onToggleTechnicalDetails={() => setShowTechnicalDetails(!showTechnicalDetails)}
            onClose={onClose}
          />
        </div>
      </CustomDrawer>

      <SettlementConfirmDialog
        booking={booking}
        pendingConfirmation={pendingConfirmation}
        isSettlementProcessing={isSettlementProcessing}
        onClose={() => setPendingConfirmation(null)}
        onConfirm={handleConfirmAction}
      />

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
