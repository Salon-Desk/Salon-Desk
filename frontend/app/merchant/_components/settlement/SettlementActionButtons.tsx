'use client'

import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Lock,
  RefreshCw,
  XCircle,
} from 'lucide-react'

import { PrimaryButton } from '@/components/button'
import { formatUsd } from '@/lib/format'
import type { Booking } from '@/types'

import type { ActionConfirmation } from './SettlementConfirmDialog'

export interface SettlementActionButtonsProps {
  booking: Booking
  isSettled: boolean
  isCaptured: boolean
  isNoShowCaptured: boolean
  isVoided: boolean
  canSettle: boolean
  daysOld: number
  isSettlementProcessing: boolean
  onClose: () => void
  onSetPendingConfirmation: (action: ActionConfirmation) => void
  onOpenReschedule: () => void
}

export function SettlementActionButtons({
  booking,
  isSettled,
  isCaptured,
  isNoShowCaptured,
  isVoided,
  canSettle,
  daysOld,
  isSettlementProcessing,
  onClose,
  onSetPendingConfirmation,
  onOpenReschedule,
}: SettlementActionButtonsProps) {
  if (isSettled) {
    return (
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
    )
  }

  return (
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
        onClick={() => onSetPendingConfirmation('SHOW')}
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
          onClick={() => onSetPendingConfirmation('NO_SHOW')}
          className="rounded-xl text-xs font-medium h-9 px-3 justify-center text-rose-700 border-rose-200/80 hover:bg-rose-50/80"
          icon={<AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-rose-600" />}
          title={`No-Show (${formatUsd(booking.noShowFee)})`}
          fullWidth
        />

        <PrimaryButton
          variant="secondary"
          isDisabled={isSettlementProcessing || !canSettle}
          onClick={() => onSetPendingConfirmation('VOID')}
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
                onClick={() => onSetPendingConfirmation('REAUTH')}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-sky-700 hover:text-sky-900 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                title={
                  booking.status === 'REAUTHORIZED' || (booking.reauthorizationCount ?? 0) >= 1
                    ? 'Payment extended (Max 1)'
                    : 'Eligible for Renewal'
                }
              >
                <RefreshCw className="h-3 w-3" />
                <span>
                  {booking.status === 'REAUTHORIZED' || (booking.reauthorizationCount ?? 0) >= 1
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
            onClick={onOpenReschedule}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-800 hover:text-amber-950 hover:underline disabled:opacity-50 cursor-pointer"
          >
            <Calendar className="h-3 w-3 text-amber-700" />
            <span>Reschedule / Change Stylist</span>
          </button>
        </div>
      )}
    </div>
  )
}
