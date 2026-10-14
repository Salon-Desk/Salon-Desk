"use client";

import { ArrowLeft, Menu } from "lucide-react";
import Link from "next/link";
import { PortalSwitcher } from "@/components/layout/portal-switcher";
import { ROUTES } from "@/lib/constants";
import { ADMIN_TAB_TITLES } from "../_constants/admin-nav";
import type { AdminTabId } from "../_types/admin-types";

interface AdminHeaderProps {
  activeTab: AdminTabId;
  onOpenMobileSidebar: () => void;
  onResetDemo: () => void;
  isResetting: boolean;
}

export function AdminHeader({
  activeTab,
  onOpenMobileSidebar,
  onResetDemo,
  isResetting,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-slate-200 border-b bg-white/95 px-4 shadow-xs backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-lg border border-slate-200 bg-slate-100 p-2 text-slate-700 hover:text-slate-900 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div>
          <div className="font-mono text-[10px] text-slate-500 uppercase">
            Admin / {activeTab}
          </div>
          <h1 className="font-bold text-slate-900 text-sm tracking-tight sm:text-base">
            {ADMIN_TAB_TITLES[activeTab]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          href={ROUTES.hub}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 text-xs shadow-xs transition-colors hover:bg-slate-200 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Exit to Hub</span>
        </Link>

        <PortalSwitcher
          current="admin"
          onReset={onResetDemo}
          isResetting={isResetting}
        />
      </div>
    </header>
  );
}
