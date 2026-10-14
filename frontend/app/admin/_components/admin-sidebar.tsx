"use client";

import {
  Building2,
  Layers,
  Lock,
  Percent,
  PieChart,
  RotateCcw,
  Sliders,
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
import type { PlatformUser } from "@/types";
import { ADMIN_NAV_GROUPS, type AdminTabId } from "../_libs/admin-shared";

interface AdminSidebarProps {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
  onCloseMobile: () => void;
  organizationCount: number;
  categoryCount: number;
  staffCount: number;
  pendingCrCount: number;
  pendingSalonCount: number;
  currentUser: PlatformUser;
  onLockSession: () => void;
  onResetDemo: () => void;
  isResetting: boolean;
}

export function AdminSidebar({
  activeTab,
  onTabChange,
  onCloseMobile,
  organizationCount,
  categoryCount,
  staffCount,
  pendingCrCount,
  pendingSalonCount,
  currentUser,
  onLockSession,
  onResetDemo,
  isResetting,
}: AdminSidebarProps) {
  const tabs: SidebarTab<AdminTabId>[] = [
    {
      id: "overview",
      label: "Platform KPIs",
      icon: PieChart,
      group: ADMIN_NAV_GROUPS[0],
    },
    {
      id: "salons",
      label: "Salon Directory",
      icon: Building2,
      group: ADMIN_NAV_GROUPS[1],
      badge: pendingSalonCount > 0 ? pendingSalonCount : organizationCount,
      isAlert: pendingSalonCount > 0,
    },
    {
      id: "requests",
      label: "Approval Queue",
      icon: Sliders,
      group: ADMIN_NAV_GROUPS[1],
      badge: pendingCrCount,
      isAlert: pendingCrCount > 0,
    },
    {
      id: "commission",
      label: "Commission Rails",
      icon: Percent,
      group: ADMIN_NAV_GROUPS[2],
    },
    {
      id: "taxonomy",
      label: "Service Taxonomy",
      icon: Layers,
      group: ADMIN_NAV_GROUPS[3],
      badge: categoryCount,
    },
    {
      id: "staff",
      label: "Admin Staff & RBAC",
      icon: Users,
      group: ADMIN_NAV_GROUPS[3],
      badge: staffCount,
    },
  ];

  const initials = currentUser.name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-slate-200 border-b p-4">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" showTagline={false} linkToHome theme="light" />
          <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-bold font-mono text-[10px] text-amber-800 uppercase tracking-wider">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex shrink-0 items-center justify-between border-slate-200 border-b bg-slate-50 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-[11px] text-slate-800">
            SalonDesk HQ Global
          </span>
        </div>
        <span className="rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 font-bold font-mono text-[10px] text-amber-800">
          Live Sandbox
        </span>
      </div>

      <ConsoleSidebarNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => {
          onTabChange(tab);
          onCloseMobile();
        }}
        groups={ADMIN_NAV_GROUPS}
      />

      <div className="space-y-1 border-slate-200 border-t px-3 py-3">
        <p className="mb-1.5 px-2 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
          App Ecosystem Portals
        </p>
        <Link
          href={ROUTES.merchant}
          className="flex items-center justify-between rounded-lg px-3 py-1.5 font-medium text-slate-600 text-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <span>Salon Console</span>
          <span className="font-mono font-semibold text-[10px] text-amber-700">
            /merchant →
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

      <div className="mt-auto shrink-0 space-y-2.5 border-slate-200 border-t bg-slate-50 p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 bg-amber-100 font-bold text-amber-800 text-xs">
                {initials}
              </div>
              <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="overflow-hidden text-left">
              <div className="truncate font-bold text-slate-900 text-xs">
                {currentUser.name.replace(" (Judge Demo)", "")}
              </div>
              <div className="truncate font-mono font-semibold text-[10px] text-amber-800">
                {currentUser.role}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLockSession}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900"
            title="Lock/Sign Out Demo Session"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onResetDemo}
          disabled={isResetting}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 text-xs shadow-sm transition-colors hover:bg-slate-100 hover:text-amber-800 disabled:opacity-60"
        >
          <RotateCcw
            className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`}
          />
          <span>Reset Sandbox Data</span>
        </button>
      </div>
    </div>
  );
}
