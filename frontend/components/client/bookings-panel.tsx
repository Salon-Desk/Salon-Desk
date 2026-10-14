"use client";

import { Calendar, FileText, Lock, Shield, XCircle } from "lucide-react";
import {
  Button,
  DataTable,
  EmptyState,
  HoldStateBadge,
  SectionHeading,
} from "@/components/ui";
import type { Booking } from "@/types";

interface BookingsPanelProps {
  activeHolds: Booking[];
  pastBookings: Booking[];
  onBrowseCatalog: () => void;
  onCancel: (bookingId: string) => void;
  onViewReceipt: (booking: Booking) => void;
}

export function BookingsPanel({
  activeHolds,
  pastBookings,
  onBrowseCatalog,
  onCancel,
  onViewReceipt,
}: BookingsPanelProps) {
  return (
    <div>
      <SectionHeading
        title="My Appointments & Deposits"
        description="Manage active holds, view cryptographic receipts, or cancel before the 24-hour cutoff for a $0 charge."
        action={
          <button
            type="button"
            onClick={onBrowseCatalog}
            className="flex items-center gap-1 font-bold text-amber-600 text-xs hover:text-amber-700"
          >
            + Book Another Service
          </button>
        }
      />

      <div className="mt-6 mb-8">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
            Active Authorization Holds ({activeHolds.length})
          </h3>
        </div>

        {activeHolds.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Active Holds"
            description="You currently have no pending appointment holds. Explore services and book with zero upfront charges."
            action={
              <Button variant="primary" onClick={onBrowseCatalog}>
                Explore Service Catalog
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {activeHolds.map((booking) => (
              <ActiveHoldCard
                key={booking.id}
                booking={booking}
                onCancel={onCancel}
                onViewReceipt={onViewReceipt}
              />
            ))}
          </div>
        )}
      </div>

      <h3 className="mb-3 font-bold text-slate-800 text-sm uppercase tracking-wider">
        Past & Settled Appointments ({pastBookings.length})
      </h3>
      <DataTable
        rows={pastBookings}
        rowKey={(row) => row.id}
        emptyState="No settled appointments yet."
        columns={[
          {
            key: "id",
            header: "Booking ID",
            cell: (row) => (
              <span className="font-mono font-bold text-slate-900">
                {row.id}
              </span>
            ),
          },
          {
            key: "service",
            header: "Service & Stylist",
            cell: (row) => (
              <div>
                <div className="font-bold text-slate-800">
                  {row.serviceName}
                </div>
                <div className="text-[11px] text-slate-500">
                  {row.stylistName}
                </div>
              </div>
            ),
          },
          {
            key: "slot",
            header: "Slot",
            cell: (row) => (
              <span className="font-medium text-slate-600">
                {row.appointmentTime}
              </span>
            ),
          },
          {
            key: "settlement",
            header: "Final Settlement",
            cell: (row) => <SettlementLabel booking={row} />,
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => <HoldStateBadge status={row.status} />,
          },
          {
            key: "receipt",
            header: "Receipt",
            align: "right",
            cell: (row) => (
              <button
                type="button"
                onClick={() => onViewReceipt(row)}
                className="font-bold text-amber-600 underline hover:text-amber-700"
              >
                Details
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}

function SettlementLabel({ booking }: { booking: Booking }) {
  if (booking.status === "CAPTURED") {
    return (
      <span className="font-bold text-emerald-600">
        ${booking.servicePrice} Full Captured
      </span>
    );
  }
  if (booking.status === "NO_SHOW_CAPTURED") {
    return (
      <span className="font-bold text-rose-600">
        ${booking.noShowFee} No-Show Fee
      </span>
    );
  }
  if (booking.status === "VOIDED") {
    return <span className="font-medium text-slate-500">$0 (Hold Voided)</span>;
  }
  return <span className="text-slate-500">—</span>;
}

function ActiveHoldCard({
  booking,
  onCancel,
  onViewReceipt,
}: {
  booking: Booking;
  onCancel: (bookingId: string) => void;
  onViewReceipt: (booking: Booking) => void;
}) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-200/80 bg-white p-5 shadow-xs">
      <div className="absolute top-0 right-0 h-full w-2 bg-amber-500" />

      <div>
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <span className="block font-black text-[11px] text-amber-600 uppercase tracking-widest">
              {booking.id} • {booking.salonName}
            </span>
            <h4 className="font-extrabold text-base text-slate-900">
              {booking.serviceName}
            </h4>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-bold text-amber-700 text-xs">
            <Lock className="h-3 w-3" />
            HELD (${booking.holdAmount})
          </span>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
          <Meta label="Master Stylist" value={booking.stylistName} />
          <Meta label="Appointment Slot" value={booking.appointmentTime} />
          <Meta label="Full Service Value" value={`$${booking.servicePrice}`} />
          <div>
            <span className="block font-bold text-[10px] text-slate-400 uppercase">
              Free Cancel Window
            </span>
            <span className="font-bold text-emerald-600">
              ≥ 24 hrs prior ($0)
            </span>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2 text-[11px] text-slate-500">
          <div className="flex max-w-[220px] items-center gap-1.5 truncate font-mono">
            <Shield className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span className="truncate">{booking.consentHash}</span>
          </div>
          <span className="shrink-0 font-medium text-slate-400">PayPal v6</span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-slate-100 border-t pt-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => onViewReceipt(booking)}
        >
          <FileText className="h-3.5 w-3.5" />
          View Receipt
        </Button>
        <Button
          variant="danger"
          className="flex-1"
          onClick={() => onCancel(booking.id)}
        >
          <XCircle className="h-3.5 w-3.5" />
          Cancel & Void ($0)
        </Button>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block font-bold text-[10px] text-slate-400 uppercase">
        {label}
      </span>
      <span className="font-bold text-slate-800">{value}</span>
    </div>
  );
}
