"use client";

import { ArrowLeft, Menu, Sparkles } from "lucide-react";
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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-slate-200/80 border-b bg-white/80 px-4 shadow-xs backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Salon</span>
          <span className="text-slate-300">/</span>
          <h1 className="font-bold text-slate-900 text-sm tracking-tight">
            {MERCHANT_TAB_TITLES[currentTab]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleDrift}
          title="Toggle settlement drift simulation"
          className={`hidden items-center gap-2 rounded-xl border px-3 py-1.5 font-medium text-xs transition-all shadow-xs sm:inline-flex ${
            simulatedDrift
              ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100/70"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              simulatedDrift
                ? "animate-ping bg-amber-500"
                : "bg-emerald-500 ring-2 ring-emerald-200"
            }`}
          />
          <span className="font-mono text-[11px]">{lastReconciledAt}</span>
        </button>

        <Link
          href={ROUTES.hub}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 text-xs shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Hub</span>
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
          className="rounded-xl px-3 py-1.5 text-xs font-semibold shadow-xs"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1" />
          <span className="hidden md:inline">AI Copilot</span>
        </Button>
      </div>
    </header>
  );
}
