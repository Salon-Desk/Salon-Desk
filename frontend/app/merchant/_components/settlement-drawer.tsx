'use client'

import { AlertTriangle, Check, RefreshCw, Scissors, ShieldCheck, XCircle } from 'lucide-react'

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

export function SettlementDrawer({
  booking,
  isSettlementProcessing,
  onClose,
  onMarkShow,
  onMarkNoShow,
  onCancelAndVoid,
  onReauthorizeHold,
}: SettlementDrawerProps) {
  return (
    <Drawer
      onClose={onClose}
      title="Appointment Settlement"
      icon={<Scissors className="h-5 w-5 text-amber-600" />}
      footer={
        <div className="w-full space-y-2.5">
          <span className="block font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">
            Staff HITL Settlement Controls
          </span>

          <Button
            variant="success"
            fullWidth
            disabled={isSettlementProcessing || booking.status === 'CAPTURED'}
            onClick={() => onMarkShow(booking)}
          >
            <Check className="h-4 w-4" />
            {booking.status === 'CAPTURED'
              ? 'Full Ticket Already Captured'
              : `Mark Show & Capture Full (${formatUsd(booking.servicePrice)})`}
          </Button>

          <Button
            variant="danger"
            fullWidth
            disabled={
              isSettlementProcessing ||
              booking.status === 'NO_SHOW_CAPTURED' ||
              booking.status === 'CAPTURED'
            }
            onClick={() => onMarkNoShow(booking)}
          >
            <AlertTriangle className="h-4 w-4" />
            {booking.status === 'NO_SHOW_CAPTURED'
              ? 'No-Show Fee Captured ($30.00)'
              : `Mark No-Show (Fee Only ${formatUsd(booking.noShowFee)} · Release Rest)`}
          </Button>

          {booking.status === 'HELD' ? (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => onReauthorizeHold(booking)}
              className="border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
            >
              <RefreshCw className="h-3.5 w-3.5 text-sky-600" />
              Reauthorize Hold (Extend 72h Window)
            </Button>
          ) : null}

          <Button
            variant="secondary"
            fullWidth
            disabled={
              isSettlementProcessing || booking.status === 'VOIDED' || booking.status === 'CAPTURED'
            }
            onClick={() => onCancelAndVoid(booking)}
          >
            <XCircle className="h-3.5 w-3.5 text-slate-500" />
            Cancel Appointment &amp; Void Authorization ($0)
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Panel className="flex items-center justify-between border bg-white">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>Status:</span>
            <HoldStateBadge status={booking.status} />
          </div>
          <span className="font-bold font-mono text-[10px]">Ref: {booking.id}</span>
        </Panel>

        <Panel className="space-y-2 bg-white">
          <div className="font-bold font-mono text-[10px] text-slate-500 uppercase">
            Client Details
          </div>
          <div className="font-bold text-slate-900 text-sm">{booking.clientName}</div>
          <div className="text-slate-600">{booking.clientEmail}</div>
          <div className="font-mono text-slate-600">{booking.clientPhone}</div>
        </Panel>

        <Panel className="space-y-2 bg-white">
          <div className="font-bold font-mono text-[10px] text-slate-500 uppercase">
            Service &amp; Stylist
          </div>
          <div className="font-bold text-slate-900 text-sm">{booking.serviceName}</div>
          <div className="font-semibold text-amber-800">Stylist: {booking.stylistName}</div>
          <div className="text-slate-600">Scheduled: {booking.appointmentTime}</div>
        </Panel>

        <Panel className="space-y-2 bg-white font-mono">
          <div className="font-bold font-sans text-[10px] text-slate-500 uppercase">
            Payment &amp; Hold Policy
          </div>
          <DetailRow
            label="Full Ticket Price"
            value={formatUsd(booking.servicePrice)}
            emphasis="bold"
          />
          <DetailRow
            label="Active PayPal Hold"
            value={formatUsd(booking.holdAmount)}
            tone="amber"
            emphasis="bold"
          />
          <DetailRow label="No-Show Cutoff Fee" value={formatUsd(booking.noShowFee)} tone="rose" />
          <DetailRow label="Upfront Debited Today" value="$0.00" tone="emerald" emphasis="bold" />
        </Panel>

        <Panel className="space-y-1.5 border-amber-200 bg-amber-50/70 font-mono text-[11px]">
          <div className="font-bold font-sans text-[10px] text-amber-800 uppercase">
            PayPal Authorization Record
          </div>
          <div className="truncate text-slate-700">
            Auth ID: <span className="font-bold text-slate-900">{booking.paypalAuthId}</span>
          </div>
          <div className="truncate text-slate-700">
            Idempotency Key: <span className="text-slate-600">{booking.idempotencyKey}</span>
          </div>
          <div className="truncate text-[10px] text-slate-500">
            Consent Hash: {booking.consentHash}
          </div>
        </Panel>

        {booking.settlementNote ? (
          <Panel className="space-y-1 bg-white text-[11px] text-slate-700">
            <span className="block font-bold text-amber-800">Settlement Record:</span>
            <p>{booking.settlementNote}</p>
          </Panel>
        ) : null}
      </div>
    </Drawer>
  )
}
