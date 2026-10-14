"use client";

import {
  Building2,
  CreditCard,
  Percent,
  Plus,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import Link from "next/link";
import { Button, Card, StatCard } from "@/components/ui";
import { ROUTES } from "@/lib/constants";
import { formatUsd } from "@/lib/format";
import { useAdminContext } from "./_context/admin-context";

const ACTIVITY_FEED = [
  {
    id: "ACT-1",
    title: "PayPal Authorization Captured",
    desc: "Crown & Blade Atelier · $120.00 settled",
    time: "4m ago",
    tone: "emerald" as const,
  },
  {
    id: "ACT-2",
    title: "Cancellation Policy Amendment",
    desc: "Velvet Mane Studio · 24h → 12h cutoff submitted",
    time: "28m ago",
    tone: "amber" as const,
  },
  {
    id: "ACT-3",
    title: "No-Show Retention Enforced",
    desc: "Hana Sterling · $30.00 fee captured, hold voided",
    time: "1h ago",
    tone: "rose" as const,
  },
  {
    id: "ACT-4",
    title: "PayPal Merchant ID Verified",
    desc: "SoHo Flagship · MERCHANT_CROWN_7781 active",
    time: "3h ago",
    tone: "sky" as const,
  },
];

const TONE_DOT = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
} as const;

export default function AdminOverviewPage() {
  const { state, metrics, setIsAddSalonOpen } = useAdminContext();

  const holdVolume = metrics.totalVolume * 0.28;
  const commissionEarned = metrics.totalVolume * 0.025;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      {/* Executive Dark Mesh Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-white shadow-xs sm:p-7">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2.5 py-0.5 font-semibold text-emerald-300 text-[11px] backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Network Live · Orders v2 Rails
              </span>
              <span className="text-slate-600 text-xs">·</span>
              <span className="font-mono text-slate-400 text-xs">
                {state.organizations.length} partner salons
              </span>
            </div>
            <h1 className="font-extrabold text-2xl text-white tracking-tight sm:text-3xl">
              Platform Master Console
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              <span className="text-amber-300 font-bold">
                {formatUsd(metrics.totalVolume)}
              </span>{" "}
              total network volume · Zero card chargebacks via authorization
              holds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {metrics.pendingCrCount > 0 ? (
              <Link
                href={ROUTES.adminRequests}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 font-medium text-white text-xs shadow-xs transition-colors hover:bg-slate-700"
              >
                <Sliders className="h-3.5 w-3.5 text-amber-400" />
                <span>{metrics.pendingCrCount} Pending Approvals</span>
              </Link>
            ) : null}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddSalonOpen(true)}
              className="rounded-xl px-4 py-2 font-semibold text-xs shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Add Salon</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Network KPI Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Protection Holds"
          value={formatUsd(holdVolume)}
          icon={ShieldCheck}
          tone="amber"
          footnote={`${metrics.totalHolds} open holds across network`}
        />
        <StatCard
          label="Platform Commission (MTD)"
          value={formatUsd(commissionEarned)}
          icon={Percent}
          tone="emerald"
          emphasizeValue
          footnote="+18.4% month-over-month run-rate"
          footnoteTone="emerald"
        />
        <StatCard
          label="Partner Salons"
          value={String(state.organizations.length)}
          icon={Building2}
          tone="sky"
          footnote={`${metrics.activeCount} active · ${metrics.pendingCount} pending`}
          footnoteTone="slate"
        />
        <StatCard
          label="No-Show Recoveries"
          value={formatUsd(1890)}
          icon={CreditCard}
          tone="rose"
          footnote="0 chargebacks · 100% merchant retention"
          footnoteTone="emerald"
        />
      </div>

      {/* Main Grid: Pending Approvals & Activity Stream */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pending Approvals Quick Priority */}
        <Card
          padding="lg"
          className="space-y-4 rounded-3xl border border-slate-200/90 bg-white shadow-xs"
        >
          <div className="flex items-center justify-between border-slate-100 border-b pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Compliance Queue
              </h2>
              <p className="text-slate-500 text-xs">
                Merchant policy &amp; wallet updates
              </p>
            </div>
            <Link
              href={ROUTES.adminRequests}
              className="text-xs font-semibold text-amber-800 hover:text-amber-900"
            >
              All →
            </Link>
          </div>

          <div className="space-y-2.5">
            {state.changeRequests.slice(0, 3).map((cr) => (
              <div
                key={cr.id}
                className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3 space-y-1.5 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-800">
                    {cr.id}
                  </span>
                  <span className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 font-medium text-[10px] text-amber-900">
                    {cr.status.replace("_", " ")}
                  </span>
                </div>
                <div className="font-medium text-slate-900 text-xs">
                  {cr.type === "PAYPAL_ACCOUNT"
                    ? "PayPal ID Update"
                    : "Cancellation Policy"}
                </div>
                <div className="text-[11px] text-slate-500">{cr.salonName}</div>
              </div>
            ))}

            {state.changeRequests.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No pending requests.
              </div>
            ) : null}
          </div>
        </Card>

        {/* Live Ecosystem Activity Stream */}
        <Card
          padding="lg"
          className="space-y-4 rounded-3xl border border-slate-200/90 bg-white shadow-xs lg:col-span-2"
        >
          <div className="flex items-center justify-between border-slate-100 border-b pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Live Activity Stream
              </h2>
              <p className="text-slate-500 text-xs">
                Real-time transactions and policy events
              </p>
            </div>
            <span className="flex items-center gap-1.5 font-medium text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Telemetry Active
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {ACTIVITY_FEED.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[evt.tone]}`}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 text-xs">
                      {evt.title}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {evt.desc}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-slate-400">
                  {evt.time}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs text-slate-500 flex items-center justify-between">
            <span>PayPal Orders v2 Settlement Gateway</span>
            <span className="font-medium text-emerald-700">
              100% operational
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
