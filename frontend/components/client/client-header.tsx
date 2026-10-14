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
    <header className="sticky top-0 z-40 border-slate-200 border-b bg-white/95 shadow-xs backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.hub}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 font-semibold text-slate-600 text-xs transition-colors hover:bg-slate-200 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>App Hub</span>
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          <Link href={ROUTES.client} className="flex items-center gap-2">
            <Logo theme="light" size="sm" linkToHome={false} />
            <span className="hidden rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 font-bold text-[11px] text-amber-800 uppercase tracking-widest sm:inline-block">
              Client Discovery
            </span>
          </Link>
        </div>

        <SegmentedControl
          className="hidden md:flex"
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

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onTogglePersona}
            title="Toggle Judge Sandbox Persona"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 font-medium text-slate-700 text-xs transition-colors hover:bg-slate-200"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="hidden text-slate-500 lg:inline">Buyer:</span>
            <span className="font-semibold text-slate-900">
              {BUYER_PERSONAS[buyerPersona].shortLabel}
            </span>
            <span className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] text-slate-500">
              Switch
            </span>
          </button>

          <Button
            variant="primary"
            onClick={onToggleConcierge}
            className={conciergeOpen ? "ring-2 ring-amber-300" : undefined}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Concierge</span>
          </Button>

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
