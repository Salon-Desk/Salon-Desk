"use client";

import { Shield } from "lucide-react";
import { Modal } from "@/components/ui";
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
      <div className="mb-6 space-y-3 rounded-2xl bg-stone-50/90 p-4 font-mono text-xs border border-stone-200/50">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
          <span className="text-stone-500 font-sans">Booking ID</span>
          <span className="font-bold text-stone-900">{booking.id}</span>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
          <span className="text-stone-500 font-sans">Status</span>
          <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full text-[11px]">
            {booking.status}
          </span>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
          <span className="text-stone-500 font-sans">PayPal Auth ID</span>
          <span className="font-medium text-stone-800">
            {booking.paypalAuthId}
          </span>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
          <span className="text-stone-500 font-sans">Idempotency Key</span>
          <span className="font-medium text-stone-800">
            {booking.idempotencyKey}
          </span>
        </div>

        <div className="pt-1">
          <span className="mb-1.5 block text-stone-500 font-sans text-[11px]">
            Consent Hash (SHA-256):
          </span>
          <div className="break-all rounded-xl bg-white p-2.5 text-[10px] text-stone-700 border border-stone-200/60 leading-relaxed select-all">
            {booking.consentHash}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-full bg-stone-950 hover:bg-stone-800 text-white font-medium text-xs sm:text-sm py-3 transition-colors cursor-pointer"
      >
        Close Receipt
      </button>
    </Modal>
  );
}
