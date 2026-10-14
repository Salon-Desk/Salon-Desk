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
import { Logo } from "@/components/brand/logo";
import {
  ConsoleSidebarNav,
  type SidebarTab,
} from "@/components/layout/console-sidebar-nav";
import type { PlatformUser } from "@/types";
import {
  ADMIN_NAV_GROUPS,
  ADMIN_TAB_LABELS,
} from "../_constants/admin-nav";
import type { AdminTabId } from "../_types/admin-types";

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
      label: ADMIN_TAB_LABELS.overview,
      icon: PieChart,
      group: ADMIN_NAV_GROUPS[0],
    },
    {
      id: "salons",
      label: ADMIN_TAB_LABELS.salons,
      icon: Building2,
      group: ADMIN_NAV_GROUPS[1],
      badge: pendingSalonCount > 0 ? pendingSalonCount : organizationCount,
      isAlert: pendingSalonCount > 0,
    },
    {
      id: "requests",
      label: ADMIN_TAB_LABELS.requests,
      icon: Sliders,
      group: ADMIN_NAV_GROUPS[1],
      badge: pendingCrCount,
      isAlert: pendingCrCount > 0,
    },
    {
      id: "commission",
      label: ADMIN_TAB_LABELS.commission,
      icon: Percent,
      group: ADMIN_NAV_GROUPS[2],
    },
    {
      id: "taxonomy",
      label: ADMIN_TAB_LABELS.taxonomy,
      icon: Layers,
      group: ADMIN_NAV_GROUPS[3],
      badge: categoryCount,
    },
    {
      id: "staff",
      label: ADMIN_TAB_LABELS.staff,
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

  const displayName = currentUser.name.replace(" (Judge Demo)", "");

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between border-slate-200 border-b px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" showTagline={false} linkToHome theme="light" />
          <span className="rounded-md bg-slate-900 px-1.5 py-0.5 font-bold text-[10px] text-white uppercase tracking-wide">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
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

      <div className="mt-auto shrink-0 space-y-2 border-slate-200 border-t bg-slate-50/80 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800 text-xs">
                {initials}
              </div>
              <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="min-w-0 text-left">
              <div className="truncate font-bold text-slate-900 text-xs">
                {displayName}
              </div>
              <div className="truncate text-[10px] text-slate-500">
                {currentUser.role}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLockSession}
            className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            title="Lock session"
            aria-label="Lock session"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onResetDemo}
          disabled={isResetting}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 text-xs transition-colors hover:bg-slate-100 disabled:opacity-60"
        >
          <RotateCcw
            className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`}
          />
          Reset demo
        </button>
      </div>
    </div>
  );
}
