"use client";

import { Shield } from "lucide-react";
import { Button, DetailRow, Modal, Panel } from "@/components/ui";
import type { Booking } from "@/types";

interface ReceiptModalProps {
  booking: Booking;
  onClose: () => void;
}

export function ReceiptModal({ booking, onClose }: ReceiptModalProps) {
  return (
    <Modal
      onClose={onClose}
      size="sm"
      icon={<Shield className="h-5 w-5 text-amber-600" />}
      title="PayPal Authorization Receipt"
      description="Cryptographically verified consent record generated under the PayPal Authorization-Hold standard."
    >
      <Panel className="mb-5 space-y-2.5 font-mono text-xs">
        <DetailRow
          label="Booking ID:"
          value={<span className="font-bold">{booking.id}</span>}
        />
        <DetailRow
          label="Status:"
          value={
            <span className="font-bold text-amber-700">{booking.status}</span>
          }
        />
        <DetailRow
          label="PayPal Auth ID:"
          value={<span className="font-bold">{booking.paypalAuthId}</span>}
        />
        <DetailRow label="Idempotency Key:" value={booking.idempotencyKey} />
        <div className="border-slate-200 border-t pt-2">
          <span className="mb-1 block text-slate-500">
            Consent Hash (SHA-256):
          </span>
          <span className="block break-all rounded border border-slate-200 bg-white p-2 text-[10px] text-slate-700">
            {booking.consentHash}
          </span>
        </div>
      </Panel>

      <Button variant="dark" fullWidth onClick={onClose}>
        Close Receipt
      </Button>
    </Modal>
  );
}
