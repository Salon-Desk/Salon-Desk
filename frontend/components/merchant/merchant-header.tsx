"use client";

import { ArrowLeft, Bot, Menu } from "lucide-react";
import Link from "next/link";
import { PortalSwitcher } from "@/components/layout/portal-switcher";
import { Button } from "@/components/ui";
import { ROUTES } from "@/lib/constants";
import { MERCHANT_TAB_TITLES, type MerchantTab } from "./merchant-types";

interface MerchantHeaderProps {
  activeTab: MerchantTab;
  lastReconciledAt: string;
  simulatedDrift: boolean;
  isResetting: boolean;
  onOpenMobileSidebar: () => void;
  onToggleDrift: () => void;
  onOpenCopilot: () => void;
  onResetDemo: () => void;
}

export function MerchantHeader({
  activeTab,
  lastReconciledAt,
  simulatedDrift,
  isResetting,
  onOpenMobileSidebar,
  onToggleDrift,
  onOpenCopilot,
  onResetDemo,
}: MerchantHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-slate-200 border-b bg-white/95 px-4 shadow-xs backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-lg border border-slate-200 bg-slate-100 p-2 text-slate-700 hover:text-slate-900 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div>
          <div className="font-mono text-[10px] text-slate-500 uppercase">
            Salon Console / {activeTab}
          </div>
          <h1 className="font-bold text-slate-900 text-sm tracking-tight sm:text-base">
            {MERCHANT_TAB_TITLES[activeTab]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleDrift}
          title="Click to toggle settlement drift simulation"
          className={`hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-medium text-xs transition-colors sm:inline-flex ${
            simulatedDrift
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              simulatedDrift ? "animate-ping bg-amber-500" : "bg-emerald-500"
            }`}
          />
          <span>{lastReconciledAt}</span>
        </button>

        <Link
          href={ROUTES.hub}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 text-xs shadow-xs transition-colors hover:bg-slate-200 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Exit to Hub</span>
        </Link>

        <PortalSwitcher
          current="merchant"
          onReset={onResetDemo}
          isResetting={isResetting}
        />

        <Button variant="primary" size="sm" onClick={onOpenCopilot}>
          <Bot className="h-4 w-4 fill-white" />
          <span className="hidden md:inline">AI Copilot</span>
        </Button>
      </div>
    </header>
  );
}
