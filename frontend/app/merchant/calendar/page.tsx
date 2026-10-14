"use client";

import { Clock, Filter } from "lucide-react";
import { useState } from "react";
import { HoldStateBadge } from "@/components/ui";
import { formatUsd } from "@/lib/format";
import { useMerchantContext } from "../_context/merchant-context";

type CalendarDay = "TODAY" | "TOMORROW";

export default function MerchantCalendarPage() {
  const { state, setSelectedBooking } = useMerchantContext();
  const [calendarDay, setCalendarDay] = useState<CalendarDay>("TODAY");
  const [selectedStylistId, setSelectedStylistId] = useState<string>("ALL");

  const filteredStaff =
    selectedStylistId === "ALL"
      ? state.staff
      : state.staff.filter((s) => s.id === selectedStylistId);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Calendar &amp; Schedule
          </h1>
          <p className="text-slate-500 text-xs">
            Shift schedule with interactive settlement triggers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Day Selector */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setCalendarDay("TODAY")}
              className={`rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
                calendarDay === "TODAY"
                  ? "bg-slate-900 text-white shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCalendarDay("TOMORROW")}
              className={`rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
                calendarDay === "TOMORROW"
                  ? "bg-slate-900 text-white shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Stylist Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedStylistId}
              onChange={(e) => setSelectedStylistId(e.target.value)}
              className="bg-transparent font-medium text-xs text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Stylists ({state.staff.length})</option>
              {state.staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sleek Status Indicator Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-slate-600">Active Hold</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <span className="text-slate-600">Reauthorized</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Captured</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-slate-600">No-Show Retained</span>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          <span>9:00 AM – 6:00 PM</span>
        </div>
      </div>

      {/* Main Stylist Schedule Grid */}
      <div className="overflow-x-auto rounded-3xl border border-slate-200/90 bg-white shadow-xs">
        <div className="min-w-[850px]">
          {/* Header row of Stylists */}
          <div
            className="grid border-slate-200/80 border-b bg-slate-50/70"
            style={{
              gridTemplateColumns: `repeat(${filteredStaff.length}, minmax(0, 1fr))`,
            }}
          >
            {filteredStaff.map((stylist) => (
              <div
                key={stylist.id}
                className="border-slate-200/80 border-r p-4 last:border-r-0"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={stylist.avatar}
                      alt={stylist.name}
                      className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                    />
                    <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-900 text-sm">
                      {stylist.name}
                    </div>
                    <div className="truncate text-[11px] text-slate-500">
                      {stylist.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bookings Columns */}
          <div
            className="grid min-h-[500px] gap-3 divide-x divide-slate-100 bg-slate-50/30 p-3"
            style={{
              gridTemplateColumns: `repeat(${filteredStaff.length}, minmax(0, 1fr))`,
            }}
          >
            {filteredStaff.map((stylist) => {
              const stylistBookings = state.bookings.filter(
                (b) =>
                  b.stylistId === stylist.id &&
                  (calendarDay === "TODAY"
                    ? b.appointmentTime.includes("Today") ||
                      b.appointmentTime.includes("AM") ||
                      b.appointmentTime.includes("PM")
                    : b.appointmentTime.includes("Tomorrow")),
              );

              return (
                <div key={stylist.id} className="space-y-2.5">
                  {stylistBookings.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200/60 border-dashed p-6 text-center text-slate-400 text-xs">
                      No bookings scheduled.
                    </div>
                  ) : (
                    stylistBookings.map((b) => {
                      const isHeld = b.status === "HELD";
                      const isCaptured = b.status === "CAPTURED";
                      const isNoShow = b.status === "NO_SHOW_CAPTURED";
                      const isReauth = b.status === "REAUTHORIZED";

                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className={`group relative w-full cursor-pointer rounded-2xl border p-3.5 text-left transition-all hover:shadow-sm ${
                            isHeld
                              ? "border-amber-200 bg-amber-50/70 hover:border-amber-300"
                              : isReauth
                                ? "border-sky-200 bg-sky-50/70 hover:border-sky-300"
                                : isCaptured
                                  ? "border-emerald-200 bg-emerald-50/70 hover:border-emerald-300"
                                  : isNoShow
                                    ? "border-rose-200 bg-rose-50/70 hover:border-rose-300"
                                    : "border-slate-200 bg-slate-100/60 opacity-60"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 font-semibold text-slate-800 text-xs">
                              <Clock className="h-3 w-3 text-slate-400" />
                              {b.appointmentTime}
                            </span>
                            <HoldStateBadge status={b.status} />
                          </div>

                          <div className="font-bold text-slate-900 text-sm">
                            {b.clientName}
                          </div>
                          <div className="text-slate-500 text-xs truncate">
                            {b.serviceName}
                          </div>

                          <div className="mt-2.5 flex items-center justify-between border-slate-200/60 border-t pt-2 text-[11px]">
                            <span className="font-bold text-slate-800">
                              {formatUsd(b.servicePrice)}
                            </span>
                            <span className="font-mono text-amber-800 font-medium">
                              Hold: {formatUsd(b.holdAmount)}
                            </span>
                          </div>

                          {isHeld && b.honorPeriodEndsInHours ? (
                            <div className="mt-2 text-[10px] text-amber-800 font-mono">
                              Honor period: {b.honorPeriodEndsInHours}h left
                            </div>
                          ) : null}

                          {isNoShow ? (
                            <div className="mt-2 text-[10px] text-rose-800 font-mono">
                              Fee ${b.noShowFee} retained
                            </div>
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
