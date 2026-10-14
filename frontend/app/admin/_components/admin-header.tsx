"use client";

import { ArrowLeft, ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PortalSwitcher } from "@/components/layout/portal-switcher";
import { ROUTES } from "@/lib/constants";
import {
  ADMIN_TAB_TITLES,
  getAdminTabFromPathname,
} from "../_constants/admin-nav";
import type { AdminTabId } from "../_types/admin-types";

interface AdminHeaderProps {
  activeTab?: AdminTabId;
  onOpenMobileSidebar: () => void;
  onResetDemo: () => void;
  isResetting: boolean;
}

export function AdminHeader({
  activeTab: explicitTab,
  onOpenMobileSidebar,
  onResetDemo,
  isResetting,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const currentTab = explicitTab || getAdminTabFromPathname(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-slate-200/80 border-b bg-white/90 px-4 shadow-xs backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 uppercase tracking-wider">
            <span>Platform Admin</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="font-semibold text-slate-800 capitalize">
              {currentTab}
            </span>
          </div>
          <h1 className="font-bold text-slate-900 text-sm tracking-tight sm:text-base">
            {ADMIN_TAB_TITLES[currentTab]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          href={ROUTES.hub}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 text-xs shadow-xs transition-colors hover:bg-slate-100 hover:text-slate-900"
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
