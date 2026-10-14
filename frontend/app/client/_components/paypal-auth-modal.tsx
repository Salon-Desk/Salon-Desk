"use client";

import { CheckCircle2, Lock, Shield, Sparkles, Star, User } from "lucide-react";
import { Button, DetailRow, Modal, Panel } from "@/components/ui";
import { BUYER_PERSONAS, type BuyerPersonaId } from "@/lib/constants";
import { INITIAL_STAFF } from "@/lib/data/catalog";
import { formatSlot, TIME_SLOTS } from "@/lib/data/service-content";
import type { Booking, SalonService, StaffMember } from "@/types";

export type AuthStep = "review" | "authorizing" | "success";

interface PaypalAuthModalProps {
  service: SalonService;
  stylist: StaffMember;
  slot: string;
  step: AuthStep;
  confirmedBooking: Booking | null;
  buyerPersona: BuyerPersonaId;
  onSelectStylist: (staff: StaffMember) => void;
  onSelectSlot: (slot: string) => void;
  onApprove: () => void;
  onClose: () => void;
  onViewBookings: () => void;
}

export function PaypalAuthModal({
  service,
  stylist,
  slot,
  step,
  confirmedBooking,
  buyerPersona,
  onSelectStylist,
  onSelectSlot,
  onApprove,
  onClose,
  onViewBookings,
}: PaypalAuthModalProps) {
  const buyer = BUYER_PERSONAS[buyerPersona];

  return (
    <Modal
      onClose={onClose}
      size="md"
      hideHeader={step !== "review"}
      icon={<Lock className="h-4 w-4 text-amber-600" />}
      title="PayPal Authorization Hold"
      description="Reserve chair with intent: AUTHORIZE ($0 debited today)"
    >
      {step === "review" && (
        <div>
          <Panel className="mb-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <span className="font-bold text-[10px] text-amber-600 uppercase tracking-wider">
                  {service.category}
                </span>
                <h4 className="font-bold text-slate-900 text-sm">
                  {service.name}
                </h4>
              </div>
              <span className="font-black text-base text-slate-900">
                ${service.price}
              </span>
            </div>

            <span className="mb-1 block font-bold text-[11px] text-slate-700">
              Choose Master Stylist:
            </span>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {INITIAL_STAFF.map((staff) => (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => onSelectStylist(staff)}
                  className={`rounded-xl border p-2 text-left transition-all ${
                    stylist.id === staff.id
                      ? "border-amber-500 bg-white shadow-xs ring-1 ring-amber-500"
                      : "border-slate-200 bg-white/60 hover:bg-white"
                  }`}
                >
                  <div className="truncate font-bold text-[11px] text-slate-900">
                    {staff.name}
                  </div>
                  <div className="flex items-center gap-0.5 text-[9px] text-slate-500">
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    <span>{staff.rating}</span>
                  </div>
                </button>
              ))}
            </div>

            <span className="mb-1 block font-bold text-[11px] text-slate-700">
              Select Time Slot:
            </span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {TIME_SLOTS.slice(0, 4).map((item) => {
                const slotStr = formatSlot(item);
                const selected = slot === slotStr;
                return (
                  <button
                    key={slotStr}
                    type="button"
                    onClick={() => onSelectSlot(slotStr)}
                    className={`rounded-lg border px-2 py-1.5 text-center font-semibold text-[10px] transition-all ${
                      selected
                        ? "border-amber-500 bg-amber-500 font-bold text-slate-950 shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </Panel>

          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="mb-2 flex items-center gap-1.5 font-bold text-amber-900 text-xs">
              <Shield className="h-4 w-4 text-amber-600" />
              <span>Transparent Deposit Policy</span>
            </div>
            <div className="space-y-1.5">
              <DetailRow
                label="Total Service Price (Settled at Salon):"
                value={`$${service.price}.00`}
                emphasis="bold"
              />
              <DetailRow
                label="Due Today at Checkout:"
                value="$0.00"
                tone="emerald"
                emphasis="bold"
              />
              <DetailRow
                label="Temporary Authorization Hold:"
                value={`$${service.holdDeposit}.00`}
                tone="amber"
                emphasis="bold"
                divider
              />
              <DetailRow
                label="No-Show Protection Fee:"
                value={`$${service.noShowFee}.00 (Only charged if missed without notice)`}
              />
            </div>
          </div>

          <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-100 p-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <div>
                <div className="font-bold text-slate-900 text-xs">
                  {buyer.name}
                </div>
                <div className="text-[10px] text-slate-500">{buyer.card}</div>
              </div>
            </div>
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-bold text-[10px] text-emerald-700">
              Sandbox Ready
            </span>
          </div>

          <Button variant="paypal" size="lg" fullWidth onClick={onApprove}>
            <Lock className="h-4 w-4" />
            Authorize ${service.holdDeposit} Hold with PayPal ($0 Today)
          </Button>
          <p className="mt-2.5 text-center text-[11px] text-slate-400">
            Authorization Hold: No money leaves your account today. Free
            cancellation ≥ 24 hours.
          </p>
        </div>
      )}

      {step === "authorizing" && (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 animate-spin items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600">
            <Sparkles className="h-8 w-8" />
          </div>
          <h4 className="mb-2 font-bold text-base text-slate-900">
            Contacting PayPal Payments v2 Engine...
          </h4>
          <div className="mx-auto max-w-xs space-y-1.5 font-mono text-slate-500 text-xs">
            <p>• Setting payment intent to AUTHORIZE...</p>
            <p>• Verifying card authorization availability...</p>
            <p>• Generating cryptographic consent hash...</p>
          </div>
        </div>
      )}

      {step === "success" && confirmedBooking && (
        <div className="py-4 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <span className="mb-2 inline-block rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-bold text-amber-700 text-xs">
            HELD • ${confirmedBooking.holdAmount} Authorization Placed
          </span>
          <h3 className="mb-1 font-black text-lg text-slate-900">
            Appointment Confirmed!
          </h3>
          <p className="mb-5 text-slate-500 text-xs">
            Zero dollars charged today. Your stylist{" "}
            {confirmedBooking.stylistName} is reserved for{" "}
            {confirmedBooking.appointmentTime}.
          </p>

          <Panel className="mb-6 space-y-2 text-left text-xs">
            <DetailRow
              label="Booking Reference:"
              value={
                <span className="font-mono font-bold">
                  {confirmedBooking.id}
                </span>
              }
            />
            <DetailRow
              label="PayPal Auth ID:"
              value={
                <span className="font-mono font-bold">
                  {confirmedBooking.paypalAuthId}
                </span>
              }
            />
            <DetailRow
              label="Consent Hash:"
              value={
                <span className="max-w-[200px] truncate font-mono text-[10px] text-slate-600">
                  {confirmedBooking.consentHash}
                </span>
              }
            />
            <DetailRow
              label="Charged Today:"
              value="$0.00"
              tone="emerald"
              emphasis="bold"
              divider
            />
          </Panel>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="dark" onClick={onViewBookings}>
              View in My Bookings
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
