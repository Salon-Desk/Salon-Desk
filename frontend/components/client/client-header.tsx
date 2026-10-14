"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { PortalSwitcher } from "@/components/layout";
import { Button, SegmentedControl } from "@/components/ui";
import { BUYER_PERSONAS, type BuyerPersonaId, ROUTES } from "@/lib/constants";

export type ClientTab = "catalog" | "my-bookings";

interface ClientHeaderProps {
  activeTab: ClientTab;
  onTabChange: (tab: ClientTab) => void;
  activeHoldsCount: number;
  buyerPersona: BuyerPersonaId;
  onTogglePersona: () => void;
  conciergeOpen: boolean;
  onToggleConcierge: () => void;
  onReset: () => void;
  isResetting: boolean;
}

export function ClientHeader({
  activeTab,
  onTabChange,
  activeHoldsCount,
  buyerPersona,
  onTogglePersona,
  conciergeOpen,
  onToggleConcierge,
  onReset,
  isResetting,
}: ClientHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-xs backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        {/* Left Side: Back Link & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href={ROUTES.hub}
            title="Return to App Hub"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-600 text-xs transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Hub</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <Link href={ROUTES.client} className="flex items-center gap-2">
            <Logo theme="light" size="sm" linkToHome={false} />
            <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-bold text-[10px] text-amber-800 uppercase tracking-widest md:inline-block">
              Discovery
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <div className="hidden md:flex">
          <SegmentedControl
            value={activeTab}
            onChange={onTabChange}
            options={[
              { value: "catalog", label: "Explore Services" },
              {
                value: "my-bookings",
                label: "My Bookings",
                badge: activeHoldsCount,
              },
            ]}
          />
        </div>

        {/* Right Side: Persona Switcher, AI Concierge, PortalSwitcher */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Persona Switcher Chip */}
          <button
            type="button"
            onClick={onTogglePersona}
            title="Toggle Judge Sandbox Persona"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 sm:px-2.5 py-1.5 font-medium text-slate-700 text-xs transition-colors hover:bg-slate-100 cursor-pointer"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="hidden sm:inline text-slate-400">Buyer:</span>
            <span className="font-semibold text-slate-900 truncate max-w-[80px] sm:max-w-none">
              {BUYER_PERSONAS[buyerPersona].shortLabel}
            </span>
          </button>

          {/* AI Concierge Header Button */}
          <Button
            variant="primary"
            onClick={onToggleConcierge}
            className={`cursor-pointer px-3 py-1.5 text-xs font-semibold shadow-sm ${
              conciergeOpen ? "ring-2 ring-amber-400" : ""
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-950" />
            <span className="hidden sm:inline">AI Concierge</span>
          </Button>

          {/* Portal Switcher */}
          <PortalSwitcher
            current="client"
            onReset={onReset}
            isResetting={isResetting}
          />
        </div>
      </div>
    </header>
  );
}
