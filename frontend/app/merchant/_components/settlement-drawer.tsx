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
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'

import { Button, Drawer, HoldStateBadge } from '@/components/ui'
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

type ActionConfirmation = 'SHOW' | 'NO_SHOW' | 'VOID' | null

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
    <Drawer
      onClose={onClose}
      title="Appointment Settlement"
      subtitle={`Ref #${booking.id.slice(0, 8)}`}
      icon={<Scissors className="h-4.5 w-4.5 text-amber-600" />}
      footer={
        <div className="w-full space-y-3">
          {/* Safeguard Confirmation Prompt */}
          {pendingConfirmation ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-xs text-amber-950">
                    {pendingConfirmation === 'SHOW' && 'Confirm Full Ticket Capture'}
                    {pendingConfirmation === 'NO_SHOW' && 'Confirm No-Show Penalty Fee'}
                    {pendingConfirmation === 'VOID' && 'Confirm Cancellation & Full Release'}
                  </h4>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    {pendingConfirmation === 'SHOW' &&
                      `This captures ${formatUsd(booking.servicePrice)} from the client's PayPal authorization hold directly into your merchant account.`}
                    {pendingConfirmation === 'NO_SHOW' &&
                      `This captures the ${formatUsd(booking.noShowFee)} penalty fee and voids the rest of the escrow hold.`}
                    {pendingConfirmation === 'VOID' &&
                      'This releases 100% of the authorization hold. The client will be charged $0.00.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPendingConfirmation(null)}
                  disabled={isSettlementProcessing}
                  className="rounded-xl text-xs h-8 px-3"
                >
                  Cancel
                </Button>

                {pendingConfirmation === 'SHOW' && (
                  <Button
                    variant="success"
                    size="sm"
                    disabled={isSettlementProcessing}
                    onClick={() => onMarkShow(booking)}
                    className="rounded-xl text-xs h-8 px-3.5 font-semibold shadow-xs"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Confirm Capture
                  </Button>
                )}

                {pendingConfirmation === 'NO_SHOW' && (
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={isSettlementProcessing}
                    onClick={() => onMarkNoShow(booking)}
                    className="rounded-xl text-xs h-8 px-3.5 font-semibold shadow-xs"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    Confirm Penalty
                  </Button>
                )}

                {pendingConfirmation === 'VOID' && (
                  <Button
                    variant="dark"
                    size="sm"
                    disabled={isSettlementProcessing}
                    onClick={() => onCancelAndVoid(booking)}
                    className="rounded-xl text-xs h-8 px-3.5 font-semibold shadow-xs"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Confirm Void
                  </Button>
                )}
              </div>
            </div>
          ) : isSettled ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
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
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="rounded-xl text-xs"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Primary Action Button */}
              <Button
                variant="success"
                fullWidth
                disabled={isSettlementProcessing}
                onClick={() => setPendingConfirmation('SHOW')}
                className="rounded-xl text-xs font-bold h-10 px-4 justify-between shadow-xs"
              >
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Mark Show &amp; Capture
                </span>
                <span className="font-mono text-xs font-extrabold bg-emerald-700/40 px-2 py-0.5 rounded-md">
                  {formatUsd(booking.servicePrice)}
                </span>
              </Button>

              {/* Secondary Actions Row */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  disabled={isSettlementProcessing}
                  onClick={() => setPendingConfirmation('NO_SHOW')}
                  className="rounded-xl text-xs font-medium h-9 px-3 justify-center text-rose-700 border-rose-200/80 hover:bg-rose-50/80"
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-rose-600" />
                  No-Show ({formatUsd(booking.noShowFee)})
                </Button>

                <Button
                  variant="secondary"
                  disabled={isSettlementProcessing}
                  onClick={() => setPendingConfirmation('VOID')}
                  className="rounded-xl text-xs font-medium h-9 px-3 justify-center text-slate-600 hover:text-slate-900"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                  Cancel &amp; Void ($0)
                </Button>
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
                    onClick={() => onReauthorizeHold(booking)}
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
          )}
        </div>
      }
    >
      <div className="space-y-4 p-4">
        {/* Status & Escrow Pill Card */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/60 p-3.5 shadow-xs">
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
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3.5 shadow-xs">
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
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 p-4 space-y-3.5 shadow-xs">
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
              <span className="text-[11px] text-amber-900 font-medium block mb-1">Escrow Hold</span>
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
        <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-xs">
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
    </Drawer>
  )
}
