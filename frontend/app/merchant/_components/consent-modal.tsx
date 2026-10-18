'use client'

import { KeyRound } from 'lucide-react'

import { Button, Modal, Panel } from '@/components/ui'
import { formatUsd } from '@/lib/format'
import type { Booking } from '@/types'

interface ConsentModalProps {
  booking: Booking
  onClose: () => void
}

export function ConsentModal({ booking, onClose }: ConsentModalProps) {
  const freeHours = booking.policySnapshot?.free_cancel_hours
  const policyName =
    typeof booking.policySnapshot?.name === 'string' ? booking.policySnapshot.name : null

  return (
    <Modal
      onClose={onClose}
      size="lg"
      title="Cryptographic Consent Record"
      icon={<KeyRound className="h-5 w-5 text-amber-600" />}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close Receipt
        </Button>
      }
    >
      <p className="font-sans text-slate-600 text-xs leading-relaxed">
        Client authorized a PayPal hold of {formatUsd(booking.holdAmount)} with $0 charged upfront.
        Free cancellation until {booking.freeCancelDeadlineLabel}
        {freeHours != null ? ` (${String(freeHours)}h policy window)` : ''}. Agreed no-show /
        late-cancel fee: {formatUsd(booking.noShowFee)}
        {policyName ? ` under “${policyName}”` : ''}, locked at booking time.
      </p>

      <Panel className="mt-4 space-y-2 bg-white font-mono text-xs">
        <div>
          <div className="text-[10px] text-slate-500 uppercase">Locked hold amount</div>
          <div className="font-semibold text-amber-800">{formatUsd(booking.holdAmount)}</div>
        </div>
        <div>
          <div className="pt-1 text-[10px] text-slate-500 uppercase">Agreed no-show fee</div>
          <div className="font-semibold text-amber-800">{formatUsd(booking.noShowFee)}</div>
        </div>
        <div>
          <div className="pt-1 text-[10px] text-slate-500 uppercase">Free cancel deadline</div>
          <div className="font-semibold text-emerald-700">{booking.freeCancelDeadlineLabel}</div>
        </div>
        <div>
          <div className="pt-1 text-[10px] text-slate-500 uppercase">Client Signature Hash</div>
          <div className="break-all font-semibold text-amber-800">{booking.consentHash}</div>
        </div>
        <div>
          <div className="pt-1 text-[10px] text-slate-500 uppercase">PayPal Authorization ID</div>
          <div className="font-bold text-emerald-700">{booking.paypalAuthId}</div>
        </div>
        <div>
          <div className="pt-1 text-[10px] text-slate-500 uppercase">Idempotency Request Key</div>
          <div className="text-slate-800">{booking.idempotencyKey}</div>
        </div>
        <div>
          <div className="pt-1 text-[10px] text-slate-500 uppercase">Signing Standard</div>
          <div className="text-slate-700">Ed25519 SHA-256 Nonce Verification</div>
        </div>
      </Panel>
    </Modal>
  )
}
