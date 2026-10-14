"use client";

import {
  Building2,
  CreditCard,
  Percent,
  Plus,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import { Card, StatCard } from "@/components/ui";
import { formatUsd } from "@/lib/format";
import type { AdminTabId } from "../_libs/admin-shared";

interface OverviewTabProps {
  totalVolume: number;
  totalHolds: number;
  activeCount: number;
  pendingCount: number;
  suspendedCount: number;
  organizationCount: number;
  pendingCrCount: number;
  onNavigate: (tab: AdminTabId) => void;
  onAddSalon: () => void;
  onReviewPolicy: () => void;
  onAddOverride: () => void;
}

const ACTIVITY_FEED = [
  {
    id: "ACT-1",
    title: "PayPal Authorization Hold Captured",
    desc: "Crown & Blade Atelier completed appointment SD-8488 ($65.00 ticket captured via Orders v2).",
    time: "12 mins ago",
    type: "capture" as const,
  },
  {
    id: "ACT-2",
    title: "Policy Change Request Submitted",
    desc: "Velvet Mane Color Studio requested amending free cancellation window from 24h to 12h.",
    time: "45 mins ago",
    type: "policy" as const,
  },
  {
    id: "ACT-3",
    title: "No-Show Fee Retained (Partial Capture)",
    desc: "Brandon Walsh missed slot; $20.00 fee captured with final_capture: true; remaining hold balance released.",
    time: "2 hours ago",
    type: "noshow" as const,
  },
  {
    id: "ACT-4",
    title: "PayPal Merchant Verified",
    desc: "Selam Hair Studio sandbox merchant ID MERCHANT_SELAM_4412 validated and approved.",
    time: "5 hours ago",
    type: "merchant" as const,
  },
];

export function OverviewTab({
  totalVolume,
  totalHolds,
  activeCount,
  pendingCount,
  suspendedCount,
  organizationCount,
  pendingCrCount,
  onNavigate,
  onAddSalon,
  onReviewPolicy,
  onAddOverride,
}: OverviewTabProps) {
  const holdVolume = totalVolume * 0.28;
  const commissionEarned = totalVolume * 0.025;

  return (
    <div className="mx-auto w-full max-w-7xl animate-in space-y-8 duration-200 fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Holds Volume"
          value={formatUsd(holdVolume)}
          icon={ShieldCheck}
          tone="amber"
          footnote={`${totalHolds} active holds reserved on PayPal network`}
        />
        <StatCard
          label="Net Commission Earned"
          value={formatUsd(commissionEarned)}
          icon={Percent}
          tone="emerald"
          emphasizeValue
          footnote="+18.4% month-over-month yield"
          footnoteTone="emerald"
        />
        <StatCard
          label="Registered Salons"
          value={String(organizationCount)}
          icon={Building2}
          tone="sky"
          footnote={`${activeCount} Active · ${pendingCount} Pending · ${suspendedCount} Suspended`}
          footnoteTone="slate"
        />
        <StatCard
          label="No-Show Fees Captured"
          value={formatUsd(1890)}
          icon={CreditCard}
          tone="rose"
          footnote="100% partial capture recovery · 0 chargebacks"
          footnoteTone="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card padding="lg" className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
            Admin Operator Controls
          </h3>
          <p className="text-slate-600 text-xs leading-relaxed">
            Direct shortcuts to perform critical administrative tasks on the
            multi-tenant salon network.
          </p>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                onNavigate("salons");
                onAddSalon();
              }}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-800 text-xs transition-colors hover:border-amber-400 hover:bg-amber-50/50"
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-amber-600" />
                <span>Onboard New Salon Partner</span>
              </span>
              <span className="font-medium text-[10px] text-slate-500">
                Add Salon →
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate("requests");
                onReviewPolicy();
              }}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-800 text-xs transition-colors hover:border-amber-400 hover:bg-amber-50/50"
            >
              <span className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-600" />
                <span>Review Policy Change Requests</span>
              </span>
              <span className="font-bold font-mono text-[10px] text-amber-800">
                {pendingCrCount} Pending
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate("commission");
                onAddOverride();
              }}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-800 text-xs transition-colors hover:border-amber-400 hover:bg-amber-50/50"
            >
              <span className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-emerald-600" />
                <span>Configure VIP Commission Override</span>
              </span>
              <span className="font-medium text-[10px] text-slate-500">
                Overrides →
              </span>
            </button>
          </div>
        </Card>

        <Card padding="lg" className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Live Platform Activity &amp; Audit Feed
            </h3>
            <span className="flex items-center gap-1 font-bold font-mono text-[10px] text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Real-time Audit
            </span>
          </div>

          <div className="space-y-3">
            {ACTIVITY_FEED.map((evt) => (
              <div
                key={evt.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        evt.type === "capture"
                          ? "bg-emerald-500"
                          : evt.type === "policy"
                            ? "bg-amber-500"
                            : evt.type === "noshow"
                              ? "bg-rose-500"
                              : "bg-sky-500"
                      }`}
                    />
                    <span className="font-bold text-slate-900">
                      {evt.title}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-snug">{evt.desc}</p>
                </div>
                <span className="whitespace-nowrap font-mono text-[10px] text-slate-500">
                  {evt.time}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
