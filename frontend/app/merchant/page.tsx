"use client";

import {
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button, Card, HoldStateBadge, StatCard } from "@/components/ui";
import { ROUTES } from "@/lib/constants";
import { formatUsd } from "@/lib/format";
import { useMerchantContext } from "./_context/merchant-context";

export default function MerchantDashboardPage() {
  const {
    state,
    activeHoldsCount,
    activeHoldsVolume,
    capturedRevenue,
    noShowRecovered,
    setSelectedBooking,
    setInspectConsentBooking,
    setIsCopilotOpen,
  } = useMerchantContext();

  const todayBookings = state.bookings.filter((b) =>
    b.appointmentTime.includes("Today"),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      {/* Refined Executive Greeting */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-7">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/80 bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800 text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PayPal Orders v2 Rails
              </span>
              <span className="text-slate-300 text-xs">·</span>
              <span className="font-mono text-slate-500 text-xs">
                {state.salon.name}
              </span>
            </div>
            <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight sm:text-3xl">
              Welcome back, {state.salon.ownerName.split(" ")[0]}
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm">
              {activeHoldsCount} active client authorization holds totaling{" "}
              <span className="font-bold text-slate-900">
                {formatUsd(activeHoldsVolume)}
              </span>{" "}
              protected today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={ROUTES.merchantCalendar}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-medium text-slate-700 text-xs shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>Calendar</span>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCopilotOpen(true)}
              className="rounded-xl px-3.5 py-2 text-xs font-semibold shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              <span>Copilot</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Modern KPI Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Protected Holds"
          value={formatUsd(activeHoldsVolume)}
          icon={ShieldCheck}
          tone="amber"
          footnote={`${activeHoldsCount} upcoming appointments secured`}
        />
        <StatCard
          label="Captured Revenue (MTD)"
          value={formatUsd(capturedRevenue)}
          icon={DollarSign}
          tone="emerald"
          emphasizeValue
          footnote="Settled directly to PayPal balance"
        />
        <StatCard
          label="No-Show Recoveries"
          value={formatUsd(noShowRecovered)}
          icon={CreditCard}
          tone="rose"
          footnote="0 chargebacks · 100% policy enforcement"
          footnoteTone="emerald"
        />
        <StatCard
          label="Avg Cancellation Notice"
          value="28.4 hours"
          icon={Clock}
          tone="sky"
          footnote={`Policy requires ≥ ${state.salon.cancellationPolicyHours}h notice`}
          footnoteTone="slate"
        />
      </div>

      {/* Main Grid: Today's Appointments & Account Verification */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Schedule Queue */}
        <Card padding="lg" className="space-y-4 rounded-3xl lg:col-span-2">
          <div className="flex items-center justify-between border-slate-100 border-b pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Today&apos;s Appointments
              </h2>
              <p className="text-slate-500 text-xs">
                {todayBookings.length} scheduled services
              </p>
            </div>
            <Link
              href={ROUTES.merchantCalendar}
              className="inline-flex items-center gap-1 font-semibold text-amber-800 text-xs hover:text-amber-900 transition-colors"
            >
              <span>View Timeline</span>
              <span>→</span>
            </Link>
          </div>

          <div className="space-y-2.5">
            {todayBookings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No appointments scheduled for today.
              </div>
            ) : (
              todayBookings.map((b) => (
                <div
                  key={b.id}
                  className="group flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-all hover:border-amber-300 hover:bg-white hover:shadow-xs sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {b.clientName}
                      </span>
                      <HoldStateBadge status={b.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-slate-500 text-xs">
                      <span className="font-medium text-slate-800">
                        {b.serviceName}
                      </span>
                      <span>·</span>
                      <span className="font-medium text-slate-700">
                        {b.appointmentTime}
                      </span>
                      <span>·</span>
                      <span>{b.stylistName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm">
                        {formatUsd(b.servicePrice)}
                      </div>
                      <div className="font-mono text-[11px] text-amber-800">
                        Hold {formatUsd(b.holdAmount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedBooking(b)}
                        className="rounded-xl px-3 py-1.5 font-semibold text-xs h-8 shadow-xs"
                      >
                        Settle
                      </Button>
                      <button
                        type="button"
                        onClick={() => setInspectConsentBooking(b)}
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors h-8 w-8 flex items-center justify-center"
                        title="View signed client authorization receipt"
                      >
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Account Verification & Settings Summary */}
        <Card
          padding="lg"
          className="flex flex-col justify-between space-y-4 rounded-3xl"
        >
          <div className="space-y-4">
            <div className="border-slate-100 border-b pb-3">
              <h2 className="font-bold text-slate-900 text-sm">
                Account &amp; Policy
              </h2>
              <p className="text-slate-500 text-xs">Connected credentials</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">
                    PayPal Merchant ID
                  </span>
                  <span className="font-semibold text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Active
                  </span>
                </div>
                <div className="font-bold font-mono text-slate-900 text-xs truncate">
                  {state.salon.paypalMerchantId}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-1">
                <span className="text-slate-500 text-[11px] font-medium">
                  Cancellation Terms
                </span>
                <div className="font-semibold text-slate-900 text-xs">
                  ≥ {state.salon.cancellationPolicyHours} hours free
                  cancellation
                </div>
                <div className="text-slate-500 text-[11px]">
                  Standard no-show: {formatUsd(state.salon.defaultNoShowFee)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">
                    Platform Take-Rate
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {state.salon.commissionRate}%
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Includes authorization dispute protection
                </div>
              </div>
            </div>
          </div>

          <Link
            href={ROUTES.merchantSettings}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 font-medium text-slate-700 text-xs shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <span>Manage Settings</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </Link>
        </Card>
      </div>
    </div>
  );
}
