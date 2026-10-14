"use client";

import { ArrowLeft, Bot, ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PortalSwitcher } from "@/components/layout/portal-switcher";
import { Button } from "@/components/ui";
import { ROUTES } from "@/lib/constants";
import {
  getMerchantTabFromPathname,
  MERCHANT_TAB_TITLES,
  type MerchantTab,
} from "../_types/merchant-types";

interface MerchantHeaderProps {
  activeTab?: MerchantTab;
  lastReconciledAt: string;
  simulatedDrift: boolean;
  isResetting: boolean;
  onOpenMobileSidebar: () => void;
  onToggleDrift: () => void;
  onOpenCopilot: () => void;
  onResetDemo: () => void;
}

export function MerchantHeader({
  activeTab: explicitTab,
  lastReconciledAt,
  simulatedDrift,
  isResetting,
  onOpenMobileSidebar,
  onToggleDrift,
  onOpenCopilot,
  onResetDemo,
}: MerchantHeaderProps) {
  const pathname = usePathname();
  const currentTab = explicitTab || getMerchantTabFromPathname(pathname);

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
            <span>Salon Console</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="font-semibold text-amber-700 capitalize">
              {currentTab}
            </span>
          </div>
          <h1 className="font-bold text-slate-900 text-sm tracking-tight sm:text-base">
            {MERCHANT_TAB_TITLES[currentTab]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleDrift}
          title="Click to toggle settlement drift simulation for testing"
          className={`hidden items-center gap-2 rounded-xl border px-3 py-1.5 font-medium text-xs transition-all shadow-xs sm:inline-flex ${
            simulatedDrift
              ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100/70"
              : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100/70"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              simulatedDrift
                ? "animate-ping bg-amber-500"
                : "bg-emerald-500 ring-2 ring-emerald-200"
            }`}
          />
          <span className="font-mono text-[11px] font-semibold">
            {lastReconciledAt}
          </span>
        </button>

        <Link
          href={ROUTES.hub}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 text-xs shadow-xs transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Exit to Hub</span>
        </Link>

        <PortalSwitcher
          current="merchant"
          onReset={onResetDemo}
          isResetting={isResetting}
        />

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCopilot}
          className="shadow-xs hover:shadow-md transition-shadow"
        >
          <Bot className="h-4 w-4 fill-white" />
          <span className="hidden md:inline">AI Copilot</span>
        </Button>
      </div>
    </header>
  );
}
