'use client'

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  RefreshCw,
  Scissors,
  ShieldAlert,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'

import { Button, DetailRow, Drawer, HoldStateBadge, Panel } from '@/components/ui'
import { formatUsd } from '@/lib/format'
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
  const [activeStep, setActiveStep] = useState<'AUDIT' | 'SETTLE'>('AUDIT')
  const [pendingConfirmation, setPendingConfirmation] = useState<ActionConfirmation>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const isCaptured = booking.status === 'CAPTURED'
  const isNoShowCaptured = booking.status === 'NO_SHOW_CAPTURED'
  const isVoided = booking.status === 'VOIDED'

  return (
    <Drawer
      onClose={onClose}
      title="Appointment Settlement Sheet"
      subtitle={`Booking Ref: ${booking.id.slice(0, 8)} · Human-In-The-Loop Controls`}
      icon={<Scissors className="h-5 w-5 text-amber-600" />}
      footer={
        <div className="w-full space-y-3">
          {/* Safeguard Confirmation Prompt */}
          {pendingConfirmation ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-amber-950">
                    {pendingConfirmation === 'SHOW' && 'Confirm Full Ticket Capture'}
                    {pendingConfirmation === 'NO_SHOW' && 'Confirm No-Show Penalty Capture'}
                    {pendingConfirmation === 'VOID' && 'Confirm Cancellation & Full Void'}
                  </h4>
                  <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                    {pendingConfirmation === 'SHOW' &&
                      `This will immediately capture ${formatUsd(booking.servicePrice)} from the client's PayPal authorization hold.`}
                    {pendingConfirmation === 'NO_SHOW' &&
                      `This captures the ${formatUsd(booking.noShowFee)} penalty fee and releases the remainder of the escrow hold to the client.`}
                    {pendingConfirmation === 'VOID' &&
                      'This cancels the appointment, releases 100% of the authorization hold, and leaves $0 charged to the client.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPendingConfirmation(null)}
                  disabled={isSettlementProcessing}
                  className="rounded-lg text-xs"
                >
                  Cancel
                </Button>

                {pendingConfirmation === 'SHOW' && (
                  <Button
                    variant="success"
                    size="sm"
                    disabled={isSettlementProcessing}
                    onClick={() => onMarkShow(booking)}
                    className="rounded-lg text-xs"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Confirm Capture
                  </Button>
                )}

                {pendingConfirmation === 'NO_SHOW' && (
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={isSettlementProcessing}
                    onClick={() => onMarkNoShow(booking)}
                    className="rounded-lg text-xs"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Confirm No-Show
                  </Button>
                )}

                {pendingConfirmation === 'VOID' && (
                  <Button
                    variant="dark"
                    size="sm"
                    disabled={isSettlementProcessing}
                    onClick={() => onCancelAndVoid(booking)}
                    className="rounded-lg text-xs"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Confirm Void
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                Staff HITL Settlement Actions
              </span>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="success"
                  fullWidth
                  disabled={isSettlementProcessing || isCaptured}
                  onClick={() => setPendingConfirmation('SHOW')}
                  className="rounded-lg text-xs font-bold justify-between h-9 px-3.5"
                >
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    {isCaptured
                      ? 'Ticket Already Captured'
                      : `Mark Show & Capture Full (${formatUsd(booking.servicePrice)})`}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-70" />
                </Button>

                <Button
                  variant="danger"
                  fullWidth
                  disabled={isSettlementProcessing || isNoShowCaptured || isCaptured}
                  onClick={() => setPendingConfirmation('NO_SHOW')}
                  className="rounded-lg text-xs font-bold justify-between h-9 px-3.5"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {isNoShowCaptured
                      ? 'No-Show Fee Captured'
                      : `Mark No-Show (Fee Only ${formatUsd(booking.noShowFee)})`}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-70" />
                </Button>

                {booking.status === 'HELD' || booking.status === 'REAUTHORIZED' ? (
                  <Button
                    variant="secondary"
                    fullWidth
                    disabled={
                      isSettlementProcessing ||
                      booking.status === 'REAUTHORIZED' ||
                      (booking.reauthorizationCount ?? 0) >= 1
                    }
                    onClick={() => onReauthorizeHold(booking)}
                    className="rounded-lg border-sky-200/90 bg-sky-50 text-sky-800 hover:bg-sky-100 text-xs justify-between h-9 px-3.5"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 text-sky-600" />
                      {booking.status === 'REAUTHORIZED' || (booking.reauthorizationCount ?? 0) >= 1
                        ? 'Already Reauthorized (Max 1)'
                        : 'Reauthorize Hold (Extend 72h Window)'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-70" />
                  </Button>
                ) : null}

                <Button
                  variant="secondary"
                  fullWidth
                  disabled={isSettlementProcessing || isVoided || isCaptured}
                  onClick={() => setPendingConfirmation('VOID')}
                  className="rounded-lg text-xs font-semibold justify-between h-9 px-3.5"
                >
                  <span className="flex items-center gap-2 text-slate-700">
                    <XCircle className="h-3.5 w-3.5 text-slate-500" />
                    Cancel Appointment & Void Authorization ($0)
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-70" />
                </Button>
              </div>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4 p-4">
        {/* Step Tabs */}
        <div className="flex items-center rounded-lg border border-slate-200/80 bg-slate-100/70 p-1">
          <button
            type="button"
            onClick={() => setActiveStep('AUDIT')}
            className={`flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-all ${
              activeStep === 'AUDIT'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Escrow & Client Audit
          </button>
          <button
            type="button"
            onClick={() => setActiveStep('SETTLE')}
            className={`flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-all ${
              activeStep === 'SETTLE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Settlement Policy
          </button>
        </div>

        {/* Status header banner */}
        <Panel className="flex items-center justify-between border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Escrow State:</span>
            <HoldStateBadge status={booking.status} />
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
            <span>Ref: {booking.id.slice(0, 8)}</span>
            <button
              type="button"
              onClick={() => handleCopy(booking.id, 'id')}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              title="Copy ID"
            >
              {copiedKey === 'id' ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </Panel>

        {activeStep === 'AUDIT' ? (
          <>
            {/* Client & Service Information */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Panel className="space-y-1.5 bg-white border-slate-200/80 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-1.5 font-bold font-mono text-[10px] text-slate-400 uppercase">
                  <User className="h-3 w-3" />
                  <span>Client Profile</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">{booking.clientName}</div>
                <div className="text-xs text-slate-600 truncate">{booking.clientEmail}</div>
                <div className="font-mono text-xs text-slate-500">
                  {booking.clientPhone || 'No phone'}
                </div>
              </Panel>

              <Panel className="space-y-1.5 bg-white border-slate-200/80 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-1.5 font-bold font-mono text-[10px] text-slate-400 uppercase">
                  <Clock className="h-3 w-3" />
                  <span>Service & Stylist</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">{booking.serviceName}</div>
                <div className="text-xs font-medium text-amber-800">
                  Stylist: {booking.stylistName}
                </div>
                <div className="text-xs text-slate-500">{booking.appointmentTime}</div>
              </Panel>
            </div>

            {/* PayPal Authorization Record */}
            <Panel className="space-y-2 border-amber-200/70 bg-amber-50/50 p-3.5 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="font-bold font-mono text-[10px] text-amber-900 uppercase">
                  PayPal Orders v2 Authorization Record
                </span>
                <span className="rounded-md bg-amber-100/90 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-amber-900">
                  Zero Upfront Debit
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px] text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Auth ID:</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span>{booking.paypalAuthId || 'AUTH_HOLD_PENDING'}</span>
                    {booking.paypalAuthId && (
                      <button
                        type="button"
                        onClick={() => handleCopy(booking.paypalAuthId, 'auth')}
                        className="text-slate-400 hover:text-slate-700"
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
                  <span className="text-slate-700 truncate max-w-[180px]">
                    {booking.idempotencyKey || 'IDEMP_KEY_ACTIVE'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Consent Hash:</span>
                  <span className="text-slate-400 text-[10px] truncate max-w-[180px]">
                    {booking.consentHash || 'SHA256_VERIFIED'}
                  </span>
                </div>
              </div>
            </Panel>
          </>
        ) : (
          /* Step 2: Settlement Policy */
          <Panel className="space-y-2.5 bg-white border-slate-200/80 p-4 font-mono text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="font-bold font-sans text-xs text-slate-900 uppercase tracking-wide">
                Payment &amp; Hold Policy Breakdown
              </div>
              <CreditCard className="h-4 w-4 text-slate-400" />
            </div>

            <DetailRow
              label="Full Service Price"
              value={formatUsd(booking.servicePrice)}
              emphasis="bold"
            />
            <DetailRow
              label="Active PayPal Authorization Hold"
              value={formatUsd(booking.holdAmount)}
              tone="amber"
              emphasis="bold"
            />
            <DetailRow
              label="No-Show Cancellation Penalty Fee"
              value={formatUsd(booking.noShowFee)}
              tone="rose"
            />
            <DetailRow
              label="Free Cancel Deadline (Locked)"
              value={booking.freeCancelDeadlineLabel || booking.authExpiresAt}
              tone="emerald"
            />
            {booking.honorExpiresLabel ? (
              <DetailRow
                label="PayPal Honor Window Ends"
                value={booking.honorExpiresLabel}
                tone="sky"
              />
            ) : null}
            {booking.reauthorizedAt ? (
              <DetailRow label="Last Reauthorization" value={booking.reauthorizedAt} tone="sky" />
            ) : null}
            <DetailRow
              label="Customer Upfront Debit (Today)"
              value="$0.00 (Zero Upfront Charge)"
              tone="emerald"
              emphasis="bold"
            />

            <div className="pt-2 text-[11px] font-sans text-slate-500 leading-relaxed border-t border-slate-100">
              Settlements use booking-time snapshots only. Marking &ldquo;Show &amp; Capture&rdquo;
              captures {formatUsd(booking.servicePrice)}. Past the free-cancel deadline (
              {booking.freeCancelDeadlineLabel}), &ldquo;Mark No-Show&rdquo; captures only the{' '}
              {formatUsd(booking.noShowFee)} fee and releases the remainder.
            </div>
          </Panel>
        )}

        {booking.settlementNote ? (
          <Panel className="space-y-1 bg-white border-slate-200/80 p-3 text-[11px] text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="block font-bold text-amber-800">Settlement Audit Record:</span>
            <p>{booking.settlementNote}</p>
          </Panel>
        ) : null}
      </div>
    </Drawer>
  )
}
