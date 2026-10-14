"use client";

import {
  Activity,
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
import {
  MERCHANT_TAB_GROUPS,
  MERCHANT_TAB_ROUTES,
} from "../_types/merchant-types";

interface MerchantSidebarProps {
  salon: MerchantSalonInfo;
  activeTab: MerchantTab;
  activeHoldsCount: number;
  bookingsCount: number;
  staffCount: number;
  servicesCount: number;
  pendingChangeRequests: number;
  isResetting: boolean;
  onTabChange?: (tab: MerchantTab) => void;
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
      label: "Dashboard",
      icon: Activity,
      group: "Salon Operations",
      badge: activeHoldsCount,
      isAlert: true,
      href: MERCHANT_TAB_ROUTES.dashboard,
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: Calendar,
      group: "Salon Operations",
      badge: activeHoldsCount,
      isAlert: true,
      href: MERCHANT_TAB_ROUTES.calendar,
    },
    {
      id: "appointments",
      label: "Appointments",
      icon: FileText,
      group: "Salon Operations",
      badge: bookingsCount,
      href: MERCHANT_TAB_ROUTES.appointments,
    },
    {
      id: "staff",
      label: "Staff",
      icon: Users,
      group: "Salon Configuration",
      badge: staffCount,
      href: MERCHANT_TAB_ROUTES.staff,
    },
    {
      id: "services",
      label: "Services",
      icon: Scissors,
      group: "Salon Configuration",
      badge: servicesCount,
      href: MERCHANT_TAB_ROUTES.services,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      group: "Salon Configuration",
      badge: pendingChangeRequests,
      isAlert: true,
      href: MERCHANT_TAB_ROUTES.settings,
    },
  ];

  const handleNavChange = (tab: MerchantTab) => {
    onTabChange?.(tab);
    onCloseMobile?.();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white/95 backdrop-blur-md">
      {/* Brand Header */}
      <div className="flex shrink-0 items-center justify-between border-slate-200/80 border-b p-4">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" showTagline={false} linkToHome theme="light" />
          <span className="rounded-md border border-amber-300/80 bg-amber-50 px-2 py-0.5 font-bold font-mono text-[10px] text-amber-900 uppercase tracking-wider">
            Merchant
          </span>
        </div>
        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Salon Identification Badge */}
      <div className="flex shrink-0 items-center justify-between border-slate-200/80 border-b bg-slate-50/60 px-4 py-2.5 text-xs">
        <div className="flex min-w-0 items-center gap-2 truncate">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <div className="min-w-0 truncate text-left">
            <div className="truncate font-semibold text-slate-900 text-xs">
              {salon.name}
            </div>
          </div>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-amber-900 font-semibold bg-amber-100/70 px-1.5 py-0.5 rounded">
          {salon.commissionRate}% VIP
        </span>
      </div>

      {/* Navigation */}
      <ConsoleSidebarNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleNavChange}
        groups={MERCHANT_TAB_GROUPS}
      />

      {/* Copilot Action & Cross-Portal Links */}
      <div className="space-y-3 px-3 pb-3">
        <button
          type="button"
          onClick={onOpenCopilot}
          className="flex w-full items-center justify-between rounded-xl border border-amber-200/90 bg-amber-50/70 px-3 py-2 text-xs font-semibold text-amber-900 shadow-xs transition-all hover:bg-amber-100/80 hover:border-amber-300"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>AI Copilot</span>
          </span>
          <span className="font-mono text-[10px] text-amber-700 font-normal">
            Assistant
          </span>
        </button>

        {/* Portal Switcher */}
        <div className="space-y-0.5 border-slate-200/80 border-t pt-2.5">
          <span className="block px-3 pb-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
            Portals
          </span>
          <Link
            href={ROUTES.admin}
            className="flex items-center justify-between rounded-lg px-3 py-1.5 font-medium text-slate-600 text-xs transition-colors hover:bg-slate-100/80 hover:text-slate-900"
          >
            <span>Platform Admin</span>
            <span className="font-mono text-[10px] text-slate-400">/admin</span>
          </Link>
          <Link
            href={ROUTES.client}
            className="flex items-center justify-between rounded-lg px-3 py-1.5 font-medium text-slate-600 text-xs transition-colors hover:bg-slate-100/80 hover:text-slate-900"
          >
            <span>Client Booking</span>
            <span className="font-mono text-[10px] text-slate-400">
              /client
            </span>
          </Link>
        </div>
      </div>

      {/* User Footer */}
      <div className="mt-auto shrink-0 space-y-2 border-slate-200/80 border-t bg-slate-50/60 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-amber-100 font-bold text-amber-900 text-xs">
              {salon.ownerName.charAt(0)}
            </div>
            <div className="overflow-hidden text-left">
              <div className="truncate font-semibold text-slate-900 text-xs">
                {salon.ownerName}
              </div>
              <div className="text-[10px] text-slate-400">Owner</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLockSession}
            className="rounded-lg border border-slate-200 bg-white p-1 text-slate-400 shadow-xs transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="Lock Session"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onResetDemo}
          disabled={isResetting}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-600 text-xs shadow-xs transition-all hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60"
        >
          <RotateCcw
            className={`h-3 w-3 ${isResetting ? "animate-spin" : ""}`}
          />
          Reset Demo Data
        </button>
      </div>
    </div>
  );
}
