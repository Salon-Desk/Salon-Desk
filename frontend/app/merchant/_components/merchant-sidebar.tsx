"use client";

import {
  Activity,
  Bot,
  Calendar,
  FileText,
  Lock,
  RotateCcw,
  Scissors,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import {
  ConsoleSidebarNav,
  type SidebarTab,
} from "@/components/layout/console-sidebar-nav";
import { ROUTES } from "@/lib/constants";
import type { MerchantSalonInfo } from "@/lib/data/merchant";
import type { MerchantTab } from "../_types/merchant-types";
import { MERCHANT_TAB_GROUPS } from "../_types/merchant-types";

interface MerchantSidebarProps {
  salon: MerchantSalonInfo;
  activeTab: MerchantTab;
  activeHoldsCount: number;
  bookingsCount: number;
  staffCount: number;
  servicesCount: number;
  pendingChangeRequests: number;
  isResetting: boolean;
  onTabChange: (tab: MerchantTab) => void;
  onOpenCopilot: () => void;
  onLockSession: () => void;
  onResetDemo: () => void;
  onCloseMobile?: () => void;
}

export function MerchantSidebar({
  salon,
  activeTab,
  activeHoldsCount,
  bookingsCount,
  staffCount,
  servicesCount,
  pendingChangeRequests,
  isResetting,
  onTabChange,
  onOpenCopilot,
  onLockSession,
  onResetDemo,
  onCloseMobile,
}: MerchantSidebarProps) {
  const tabs: SidebarTab<MerchantTab>[] = [
    {
      id: "dashboard",
      label: "Dashboard & KPIs",
      icon: Activity,
      group: "Salon Operations",
      badge: activeHoldsCount,
      isAlert: true,
    },
    {
      id: "calendar",
      label: "Calendar & Schedule",
      icon: Calendar,
      group: "Salon Operations",
      badge: activeHoldsCount,
      isAlert: true,
    },
    {
      id: "appointments",
      label: "Appointments & Ledger",
      icon: FileText,
      group: "Salon Operations",
      badge: bookingsCount,
    },
    {
      id: "staff",
      label: "Staff & Stylists",
      icon: Users,
      group: "Salon Configuration",
      badge: staffCount,
    },
    {
      id: "services",
      label: "Services & Pricing",
      icon: Scissors,
      group: "Salon Configuration",
      badge: servicesCount,
    },
    {
      id: "settings",
      label: "PayPal & Policy Settings",
      icon: Settings,
      group: "Salon Configuration",
      badge: pendingChangeRequests,
      isAlert: true,
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-slate-200 border-b p-4">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" showTagline={false} linkToHome theme="light" />
          <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-bold font-mono text-[10px] text-amber-800 uppercase tracking-wider">
            Salon
          </span>
        </div>
        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center justify-between border-slate-200 border-b bg-slate-50 px-4 py-3 text-xs">
        <div className="flex min-w-0 items-center gap-2 truncate">
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
          <div className="min-w-0 truncate text-left">
            <div className="truncate font-bold text-slate-900 text-xs">
              {salon.name}
            </div>
            <div className="truncate font-mono text-[10px] text-slate-500">
              {salon.city}
            </div>
          </div>
        </div>
        <span className="shrink-0 rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 font-bold font-mono text-[9px] text-amber-900">
          VIP {salon.commissionRate}%
        </span>
      </div>

      <ConsoleSidebarNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={onTabChange}
        groups={MERCHANT_TAB_GROUPS}
      />

      <div className="space-y-5 px-3 pb-3">
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
          <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
            <span className="flex items-center gap-1.5 text-amber-800">
              <Bot className="h-4 w-4 text-amber-600" />
              Owner AI Assistant
            </span>
            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold font-mono text-[9px] text-amber-900">
              v1.11
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-snug">
            Ask questions or propose goodwill partial refunds using PayPal Agent
            Toolkit.
          </p>
          <button
            type="button"
            onClick={onOpenCopilot}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-1.5 font-bold text-white text-xs shadow-xs transition-colors hover:from-amber-600 hover:to-amber-700"
          >
            <Sparkles className="h-3.5 w-3.5 fill-white" />
            Open Assistant
          </button>
        </div>

        <div className="space-y-1 border-slate-200 border-t pt-3">
          <span className="block px-3 pb-1 font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">
            Ecosystem Jump
          </span>
          <Link
            href={ROUTES.admin}
            className="flex items-center justify-between rounded-lg px-3 py-1.5 font-medium text-slate-600 text-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <span>Platform Admin</span>
            <span className="font-mono font-semibold text-[10px] text-amber-800">
              /admin →
            </span>
          </Link>
          <Link
            href={ROUTES.client}
            className="flex items-center justify-between rounded-lg px-3 py-1.5 font-medium text-slate-600 text-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <span>Client Experience</span>
            <span className="font-mono font-semibold text-[10px] text-sky-700">
              /client →
            </span>
          </Link>
          <Link
            href={ROUTES.hub}
            className="flex items-center justify-between rounded-lg px-3 py-1.5 font-medium text-slate-600 text-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <span>App Hub Gateway</span>
            <span className="font-mono text-[10px] text-slate-500">/ →</span>
          </Link>
        </div>
      </div>

      <div className="mt-auto shrink-0 space-y-2.5 border-slate-200 border-t bg-slate-50 p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 bg-amber-100 font-bold text-amber-800 text-xs">
                ST
              </div>
              <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="overflow-hidden text-left">
              <div className="truncate font-bold text-slate-900 text-xs">
                {salon.ownerName}
              </div>
              <div className="truncate font-mono font-semibold text-[10px] text-amber-800">
                Salon Owner
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLockSession}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-xs transition-colors hover:bg-slate-100 hover:text-slate-900"
            title="Lock Session"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onResetDemo}
          disabled={isResetting}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 text-xs shadow-xs transition-colors hover:bg-slate-100 hover:text-amber-800 disabled:opacity-60"
        >
          <RotateCcw
            className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`}
          />
          Reset Salon Demo Data
        </button>
      </div>
    </div>
  );
}
