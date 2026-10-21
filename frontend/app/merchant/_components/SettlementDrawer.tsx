'use client'

import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Phone,
  RefreshCw,
  Scissors,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { CustomDrawer } from '@/components/drawer/CustomDrawer'
import { HoldStateBadge } from '@/components/ui'
import { formatUsd } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Booking } from '@/types'

interface SettlementDrawerProps {
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
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

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
  const isSettled = isCaptured || isNoShowCaptured || isVoided

  const clientInitials =
    booking.clientName
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CL'

  return (
    <>
      {/* 1. Main Appointment Settlement Details Drawer */}
      <CustomDrawer
        open={true}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
        direction="right"
        header={
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
              <Scissors className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Appointment Settlement</h3>
              <p className="font-mono text-xs text-slate-500">Ref #{booking.id.slice(0, 8)}</p>
            </div>
          </div>
        }
        footer={
          isSettled ? (
            <div className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900">
                    {isCaptured && 'Settlement Complete — Full Ticket Captured'}
                    {isNoShowCaptured && 'Settlement Complete — No-Show Fee Captured'}
                    {isVoided && 'Appointment Cancelled — Escrow Voided'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    No pending actions required on this ticket.
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
              {/* Primary Action Button */}
              <PrimaryButton
                variant="success"
                fullWidth
                isDisabled={isSettlementProcessing}
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
              <div className="grid grid-cols-2 gap-2">
                <PrimaryButton
                  variant="secondary"
                  isDisabled={isSettlementProcessing}
                  onClick={() => setPendingConfirmation('NO_SHOW')}
                  className="rounded-xl text-xs font-medium h-9 px-3 justify-center text-rose-700 border-rose-200/80 hover:bg-rose-50/80"
                  icon={<AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-rose-600" />}
                  title={`No-Show (${formatUsd(booking.noShowFee)})`}
                  fullWidth
                />

                <PrimaryButton
                  variant="secondary"
                  isDisabled={isSettlementProcessing}
                  onClick={() => setPendingConfirmation('VOID')}
                  className="rounded-xl text-xs font-medium h-9 px-3 justify-center text-slate-600 hover:text-slate-900"
                  icon={<XCircle className="h-3.5 w-3.5 mr-1.5 text-slate-400" />}
                  title="Cancel & Void ($0)"
                  fullWidth
                />
              </div>

              {/* Reauthorize option if within valid window */}
              {(booking.status === 'HELD' || booking.status === 'REAUTHORIZED') && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    disabled={
                      isSettlementProcessing ||
                      booking.status === 'REAUTHORIZED' ||
                      (booking.reauthorizationCount ?? 0) >= 1
                    }
                    onClick={() => setPendingConfirmation('REAUTH')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-700 hover:text-sky-900 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>
                      {booking.status === 'REAUTHORIZED' || (booking.reauthorizationCount ?? 0) >= 1
                        ? 'Authorization extended (Max 1 reauthorization)'
                        : 'Extend PayPal honor window (Reauthorize 72h)'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )
        }
      >
        <div className="space-y-4">
          {/* Status & Escrow Pill Card */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/60 p-3.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Escrow Status:</span>
              <HoldStateBadge status={booking.status} />
            </div>
            <div className="flex items-center gap-1 font-mono text-xs font-medium text-slate-500">
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

            {/* Service & Stylist Row */}
            <div className="grid grid-cols-2 gap-3 text-xs">
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
              </div>
            </div>
          </div>

          {/* Financial & Hold Policy Card */}
          <div className="space-y-3.5 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Settlement Financials
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                <Check className="h-2.5 w-2.5" />
                $0 Upfront Debit
              </span>
            </div>

            {/* Large Price Highlight */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <span className="text-[11px] text-slate-500 block mb-1">Ticket Total</span>
                <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                  {formatUsd(booking.servicePrice)}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Full service price</span>
              </div>

              <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3">
                <span className="text-[11px] text-amber-900 font-medium block mb-1">
                  Escrow Hold
                </span>
                <div className="text-xl font-bold font-mono text-amber-900 tabular-nums">
                  {formatUsd(booking.holdAmount)}
                </div>
                <span className="text-[10px] text-amber-700 mt-0.5 block">
                  Authorized hold amount
                </span>
              </div>
            </div>

            {/* Policy details list */}
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>No-Show Penalty Fee</span>
                <span className="font-mono font-semibold text-rose-700">
                  {formatUsd(booking.noShowFee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Free Cancellation Deadline</span>
                <span className="font-medium text-slate-800">
                  {booking.freeCancelDeadlineLabel || booking.authExpiresAt || 'Standard Policy'}
                </span>
              </div>
              {booking.honorExpiresLabel && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>PayPal Honor Window</span>
                  <span className="font-medium text-slate-800">{booking.honorExpiresLabel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Audit / Settlement Notes (if any) */}
          {booking.settlementNote && (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-700">
              <span className="font-semibold text-slate-900 block mb-1">Settlement Audit:</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">{booking.settlementNote}</p>
            </div>
          )}

          {/* Collapsible Technical Details (Clean & Out of the Way) */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <span>Technical &amp; PayPal Verification Keys</span>
              </div>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 text-slate-400 transition-transform duration-200',
                  showTechnicalDetails && 'rotate-180',
                )}
              />
            </button>

            {showTechnicalDetails && (
              <div className="border-t border-slate-100 p-3.5 space-y-2 font-mono text-[11px] bg-slate-50/50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">PayPal Auth ID:</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span className="truncate max-w-[170px]">
                      {booking.paypalAuthId || 'AUTH_HOLD_PENDING'}
                    </span>
                    {booking.paypalAuthId && (
                      <button
                        type="button"
                        onClick={() => handleCopy(booking.paypalAuthId, 'auth')}
                        className="p-1 text-slate-400 hover:text-slate-700"
                      >
                        {copiedKey === 'auth' ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Idempotency Key:</span>
                  <span className="text-slate-700 truncate max-w-[170px]">
                    {booking.idempotencyKey || 'ACTIVE'}
                  </span>
                </div>

                {booking.consentHash && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Consent Hash:</span>
                    <span className="text-slate-500 text-[10px] truncate max-w-[170px]">
                      {booking.consentHash}
                    </span>
                  </div>
                )}
              </div>
            )}
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
            <div className="flex items-center gap-3">
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
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {pendingConfirmation === 'SHOW' && 'Confirm Full Ticket Capture'}
                  {pendingConfirmation === 'NO_SHOW' && 'Confirm No-Show Penalty Fee'}
                  {pendingConfirmation === 'VOID' && 'Confirm Cancellation & Full Release'}
                  {pendingConfirmation === 'REAUTH' && 'Extend PayPal Honor Window'}
                </h3>
                <p className="font-mono text-xs text-slate-500">
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
                  title={isSettlementProcessing ? 'Extending…' : 'Confirm 72h Extension'}
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
                <span>Action Breakdown</span>
                <span className="font-mono text-[11px] font-bold">
                  {pendingConfirmation === 'SHOW' && `Capture ${formatUsd(booking.servicePrice)}`}
                  {pendingConfirmation === 'NO_SHOW' && `Capture ${formatUsd(booking.noShowFee)}`}
                  {pendingConfirmation === 'VOID' && 'Release $0.00'}
                  {pendingConfirmation === 'REAUTH' && 'Reauthorize Hold'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {pendingConfirmation === 'SHOW' &&
                  `This captures ${formatUsd(booking.servicePrice)} from the client's PayPal authorization hold directly into your merchant account.`}
                {pendingConfirmation === 'NO_SHOW' &&
                  `This captures the ${formatUsd(booking.noShowFee)} penalty fee and voids the rest of the escrow hold.`}
                {pendingConfirmation === 'VOID' &&
                  'This releases 100% of the authorization hold. The client will be charged $0.00.'}
                {pendingConfirmation === 'REAUTH' &&
                  'This reauthorizes the existing PayPal escrow authorization to extend the honor window by another 72 hours.'}
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
                <span>Escrow Hold:</span>
                <span className="font-mono font-semibold text-amber-900">
                  {formatUsd(booking.holdAmount)}
                </span>
              </div>
            </div>
          </div>
        </CustomResponsiveDialog>
      ) : null}
    </>
  )
}
