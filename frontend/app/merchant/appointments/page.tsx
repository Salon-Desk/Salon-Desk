"use client";

import {
  Activity,
  CheckCircle2,
  Copy,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Button,
  Card,
  type Column,
  DataTable,
  HoldStateBadge,
  LedgerActionBadge,
  SearchInput,
} from "@/components/ui";
import { formatUsd } from "@/lib/format";
import { HOLD_STATE_FILTER_LABEL, HOLD_STATES } from "@/lib/status";
import type { AuditLedgerEntry, Booking, HoldState } from "@/types";
import { useMerchantContext } from "../_context/merchant-context";

type AppointmentFilter = "ALL" | HoldState;

export default function MerchantAppointmentsPage() {
  const { state, setSelectedBooking, setInspectConsentBooking } =
    useMerchantContext();

  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [appointmentFilter, setAppointmentFilter] =
    useState<AppointmentFilter>("ALL");
  const [activeView, setActiveView] = useState<"BOOKINGS" | "LEDGER">(
    "BOOKINGS",
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAppointments = useMemo(
    () =>
      state.bookings.filter((b) => {
        const matchesFilter =
          appointmentFilter === "ALL" || b.status === appointmentFilter;
        const query = appointmentSearch.toLowerCase();
        const matchesSearch =
          b.clientName.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query) ||
          b.serviceName.toLowerCase().includes(query) ||
          b.stylistName.toLowerCase().includes(query);
        return matchesFilter && matchesSearch;
      }),
    [appointmentFilter, appointmentSearch, state.bookings],
  );

  const bookingColumns: Column<Booking>[] = [
    {
      key: "id",
      header: "Booking Ref",
      cell: (b) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="font-semibold text-slate-800">{b.id}</span>
          <button
            type="button"
            onClick={() => handleCopy(b.id, b.id)}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            title="Copy reference"
          >
            {copiedId === b.id ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      ),
    },
    {
      key: "client",
      header: "Client",
      cell: (b) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{b.clientName}</div>
          <div className="font-mono text-[11px] text-slate-400">
            {b.clientPhone}
          </div>
        </div>
      ),
    },
    {
      key: "service",
      header: "Service & Stylist",
      cell: (b) => (
        <div>
          <div className="font-medium text-slate-900 text-xs">
            {b.serviceName}
          </div>
          <div className="text-[11px] text-slate-500">{b.stylistName}</div>
        </div>
      ),
    },
    {
      key: "slot",
      header: "Time",
      cell: (b) => (
        <span className="font-medium text-slate-700 text-xs">
          {b.appointmentTime}
        </span>
      ),
    },
    {
      key: "hold",
      header: "Protection Hold",
      cell: (b) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">
            {formatUsd(b.servicePrice)}
          </div>
          <div className="text-[11px] text-amber-800 font-mono font-medium">
            Hold: {formatUsd(b.holdAmount)}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (b) => <HoldStateBadge status={b.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setInspectConsentBooking(b)}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="Inspect Authorization Receipt"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setSelectedBooking(b)}
            className="rounded-xl font-medium text-xs h-7 px-3 shadow-xs"
          >
            Settle
          </Button>
        </div>
      ),
    },
  ];

  const ledgerColumns: Column<AuditLedgerEntry>[] = [
    {
      key: "id",
      header: "Ledger ID",
      cell: (entry) => (
        <span className="font-bold font-mono text-slate-800 text-xs">
          {entry.id}
        </span>
      ),
    },
    {
      key: "booking",
      header: "Booking Ref",
      cell: (entry) => (
        <span className="text-slate-500 font-mono text-xs">
          {entry.bookingId}
        </span>
      ),
    },
    {
      key: "client",
      header: "Client",
      cell: (entry) => (
        <span className="font-medium text-slate-900 text-xs">
          {entry.clientName}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action Rail",
      cell: (entry) => <LedgerActionBadge action={entry.action} />,
    },
    {
      key: "amount",
      header: "Volume",
      cell: (entry) => (
        <span className="font-bold text-slate-900 text-xs">
          {formatUsd(entry.amount)}
        </span>
      ),
    },
    {
      key: "debug",
      header: "PayPal Debug ID",
      cell: (entry) => (
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-500 font-mono">
            {entry.paypalDebugId}
          </span>
          <button
            type="button"
            onClick={() => handleCopy(entry.id, entry.paypalDebugId)}
            className="text-slate-400 hover:text-slate-700"
            title="Copy PayPal Debug ID"
          >
            {copiedId === entry.id ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      ),
    },
    {
      key: "time",
      header: "Timestamp",
      cell: (entry) => (
        <span className="text-[11px] text-slate-400 font-mono">
          {entry.timestamp}
        </span>
      ),
    },
  ];

  const filterOptions: AppointmentFilter[] = ["ALL", ...HOLD_STATES];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Appointments
          </h1>
          <p className="text-slate-500 text-xs">
            Client reservations, authorization holds, and settlement history.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveView("BOOKINGS")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
              activeView === "BOOKINGS"
                ? "bg-slate-900 text-white shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Bookings ({state.bookings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView("LEDGER")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
              activeView === "LEDGER"
                ? "bg-slate-900 text-white shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Audit Ledger ({state.auditLedger.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <SearchInput
            value={appointmentSearch}
            onChange={setAppointmentSearch}
            placeholder="Search by client, reference, or stylist..."
            className="w-full text-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {filterOptions.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setAppointmentFilter(st)}
              className={`rounded-lg px-2.5 py-1 font-medium text-xs transition-all ${
                appointmentFilter === st
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {st === "ALL" ? "All" : HOLD_STATE_FILTER_LABEL[st]}
            </button>
          ))}
        </div>
      </div>

      {/* Tables */}
      {activeView === "BOOKINGS" ? (
        <DataTable
          columns={bookingColumns}
          rows={filteredAppointments}
          rowKey={(b) => b.id}
          className="rounded-3xl border border-slate-200/90 bg-white shadow-xs"
        />
      ) : (
        <Card padding="lg" className="space-y-4 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between border-slate-100 border-b pb-3">
            <h3 className="font-bold text-slate-900 text-sm">
              Settlement Ledger (PayPal Orders v2)
            </h3>
            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
              Reconciled
            </span>
          </div>

          <DataTable
            columns={ledgerColumns}
            rows={state.auditLedger}
            rowKey={(entry) => entry.id}
            mono
            className="rounded-2xl shadow-none border-0"
          />
        </Card>
      )}
    </div>
  );
}
