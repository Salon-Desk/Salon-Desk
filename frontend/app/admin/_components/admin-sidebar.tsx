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
import {
  ADMIN_NAV_GROUPS,
  ADMIN_TAB_LABELS,
  ADMIN_TAB_ROUTES,
} from "../_constants/admin-nav";
import type { AdminTabId } from "../_types/admin-types";

interface AdminSidebarProps {
  activeTab: AdminTabId;
  onTabChange?: (tab: AdminTabId) => void;
  onCloseMobile?: () => void;
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
      href: ADMIN_TAB_ROUTES.overview,
    },
    {
      id: "salons",
      label: ADMIN_TAB_LABELS.salons,
      icon: Building2,
      group: ADMIN_NAV_GROUPS[1],
      badge: pendingSalonCount > 0 ? pendingSalonCount : organizationCount,
      isAlert: pendingSalonCount > 0,
      href: ADMIN_TAB_ROUTES.salons,
    },
    {
      id: "requests",
      label: ADMIN_TAB_LABELS.requests,
      icon: Sliders,
      group: ADMIN_NAV_GROUPS[1],
      badge: pendingCrCount,
      isAlert: pendingCrCount > 0,
      href: ADMIN_TAB_ROUTES.requests,
    },
    {
      id: "commission",
      label: ADMIN_TAB_LABELS.commission,
      icon: Percent,
      group: ADMIN_NAV_GROUPS[2],
      href: ADMIN_TAB_ROUTES.commission,
    },
    {
      id: "taxonomy",
      label: ADMIN_TAB_LABELS.taxonomy,
      icon: Layers,
      group: ADMIN_NAV_GROUPS[3],
      badge: categoryCount,
      href: ADMIN_TAB_ROUTES.taxonomy,
    },
    {
      id: "staff",
      label: ADMIN_TAB_LABELS.staff,
      icon: Users,
      group: ADMIN_NAV_GROUPS[3],
      badge: staffCount,
      href: ADMIN_TAB_ROUTES.staff,
    },
  ];

  const initials = currentUser.name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const displayName = currentUser.name.replace(" (Judge Demo)", "");

  const handleNavChange = (tab: AdminTabId) => {
    onTabChange?.(tab);
    onCloseMobile?.();
  };

  return (
    <div className="flex h-full flex-col bg-white/95 backdrop-blur-md overflow-hidden">
      {/* Brand Header */}
      <div className="flex shrink-0 items-center justify-between border-slate-200/80 border-b p-4">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" showTagline={false} linkToHome theme="light" />
          <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 font-bold font-mono text-[10px] text-white uppercase tracking-wider">
            Admin
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

      {/* Network Status Indicator */}
      <div className="flex shrink-0 items-center justify-between border-slate-200/80 border-b bg-slate-50/60 px-4 py-2.5 text-xs">
        <div className="flex min-w-0 items-center gap-2 truncate">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <div className="min-w-0 truncate text-left">
            <div className="truncate font-semibold text-slate-900 text-xs">
              Orders v2 Network
            </div>
          </div>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
          Sandbox
        </span>
      </div>

      {/* Navigation Tabs */}
      <ConsoleSidebarNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleNavChange}
        groups={ADMIN_NAV_GROUPS}
      />

      {/* Cross-Portal Switcher Links */}
      <div className="space-y-0.5 border-slate-200/80 border-t px-3 py-3">
        <span className="block px-3 pb-1 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
          Portals
        </span>
        <Link
          href={ROUTES.merchant}
          className="flex items-center justify-between rounded-lg px-3 py-1.5 font-medium text-slate-600 text-xs transition-colors hover:bg-slate-100/80 hover:text-slate-900"
        >
          <span>Merchant Console</span>
          <span className="font-mono text-[10px] text-slate-400">
            /merchant
          </span>
        </Link>
        <Link
          href={ROUTES.client}
          className="flex items-center justify-between rounded-lg px-3 py-1.5 font-medium text-slate-600 text-xs transition-colors hover:bg-slate-100/80 hover:text-slate-900"
        >
          <span>Client Booking</span>
          <span className="font-mono text-[10px] text-slate-400">/client</span>
        </Link>
      </div>

      {/* User Footer & Reset Demo */}
      <div className="mt-auto shrink-0 space-y-2 border-slate-200/80 border-t bg-slate-50/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-900 font-bold text-white text-xs">
              {initials}
            </div>
            <div className="min-w-0 text-left">
              <div className="truncate font-semibold text-slate-900 text-xs">
                {displayName}
              </div>
              <div className="truncate text-[10px] text-slate-400">
                {currentUser.role}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLockSession}
            className="shrink-0 rounded-lg border border-slate-200 bg-white p-1 text-slate-400 shadow-xs transition-colors hover:bg-slate-100 hover:text-slate-700"
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
