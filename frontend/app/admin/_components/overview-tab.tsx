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
import type { AdminTabId } from "../_types/admin-types";

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
    title: "Hold captured",
    desc: "Crown & Blade · $65.00",
    time: "12m",
    tone: "emerald" as const,
  },
  {
    id: "ACT-2",
    title: "Policy request",
    desc: "Velvet Mane · 24h → 12h",
    time: "45m",
    tone: "amber" as const,
  },
  {
    id: "ACT-3",
    title: "No-show retained",
    desc: "Brandon Walsh · $20.00",
    time: "2h",
    tone: "rose" as const,
  },
  {
    id: "ACT-4",
    title: "Merchant verified",
    desc: "Selam Hair Studio",
    time: "5h",
    tone: "sky" as const,
  },
];

const TONE_DOT = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
} as const;

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
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active holds"
          value={formatUsd(holdVolume)}
          icon={ShieldCheck}
          tone="amber"
          footnote={`${totalHolds} open on PayPal`}
        />
        <StatCard
          label="Commission"
          value={formatUsd(commissionEarned)}
          icon={Percent}
          tone="emerald"
          emphasizeValue
          footnote="+18.4% MoM"
          footnoteTone="emerald"
        />
        <StatCard
          label="Salons"
          value={String(organizationCount)}
          icon={Building2}
          tone="sky"
          footnote={`${activeCount} active · ${pendingCount} pending · ${suspendedCount} suspended`}
          footnoteTone="slate"
        />
        <StatCard
          label="No-show fees"
          value={formatUsd(1890)}
          icon={CreditCard}
          tone="rose"
          footnote="0 chargebacks"
          footnoteTone="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card padding="md" className="space-y-3">
          <h2 className="font-bold text-slate-900 text-sm">Quick actions</h2>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                onNavigate("salons");
                onAddSalon();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-semibold text-slate-800 text-xs transition-colors hover:border-amber-300 hover:bg-amber-50"
            >
              <Plus className="h-4 w-4 shrink-0 text-amber-600" />
              Add salon
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate("requests");
                onReviewPolicy();
              }}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-semibold text-slate-800 text-xs transition-colors hover:border-amber-300 hover:bg-amber-50"
            >
              <span className="flex items-center gap-2.5">
                <Sliders className="h-4 w-4 shrink-0 text-amber-600" />
                Review approvals
              </span>
              {pendingCrCount > 0 ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-[10px] text-amber-800">
                  {pendingCrCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate("commission");
                onAddOverride();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-semibold text-slate-800 text-xs transition-colors hover:border-amber-300 hover:bg-amber-50"
            >
              <Percent className="h-4 w-4 shrink-0 text-emerald-600" />
              Add fee override
            </button>
          </div>
        </Card>

        <Card padding="md" className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">
              Recent activity
            </h2>
            <span className="flex items-center gap-1.5 font-medium text-[10px] text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>

          <ul className="divide-y divide-slate-100">
            {ACTIVITY_FEED.map((evt) => (
              <li
                key={evt.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[evt.tone]}`}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-xs">
                      {evt.title}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {evt.desc}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-slate-400">
                  {evt.time}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
