"use client";

import {
  Building2,
  Calendar,
  CalendarRange,
  Clock,
  MessageSquare,
  PieChart,
  Scissors,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import {
  AppCard,
  DemoToolbar,
  HubHeader,
  HubHero,
  SandboxModal,
} from "@/components/hub";
import { useClientStore } from "@/hooks";
import { ROUTES } from "@/lib/constants";

export default function HubPage() {
  const { state } = useClientStore();
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);

  const activeHoldsCount = state.bookings.filter(
    (booking) => booking.status === "HELD",
  ).length;
  const orgsCount = state.organizations.length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900 selection:bg-amber-500/20 selection:text-amber-900">
      <HubHeader onOpenSandboxModal={() => setIsSandboxModalOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6">
        <HubHero />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AppCard
            title="Client Booking Experience"
            subtitle="Mobile-optimized salon discovery, conversational AI booking assistant, and PayPal non-debit authorization hold checkout."
            audience="Salon Clients & Customers"
            badge="Client Experience"
            badgeTone="sky"
            icons={[Sparkles, Calendar, MessageSquare]}
            metaHighlight="Sandbox Buyer • Jane Doe"
            route={ROUTES.client}
            actionLabel="Launch Client Experience →"
            features={[
              "Conversational AI booking agent with natural-language slot picker",
              "Seamless PayPal JS SDK v6 authorization hold (intent: AUTHORIZE)",
              "Instant self-service booking cancellation & policy window protection",
              "$0.00 debited today guarantee with cryptographic consent hash",
            ]}
          />

          <AppCard
            title="Organization Portal"
            subtitle="Real-time salon operations console, status-coded schedule timeline, and 1-click Human-in-the-Loop settlement actions."
            audience="Salon Owners, Stylists & Receptionists"
            badge="Salon Management"
            badgeTone="amber"
            icons={[Scissors, Clock, CalendarRange]}
            metaHighlight={`Crown & Blade Atelier • ${activeHoldsCount} Active Holds`}
            route={ROUTES.merchant}
            actionLabel="Launch Salon Dashboard →"
            features={[
              "Schedule timeline color-coded by hold state (Amber, Green, Red, Slate)",
              "1-Click HITL controls: Mark Show (capture full) & Mark No-Show (fee-only)",
              "Idempotent payment safeguards preventing duplicate captures",
              "Integrated salon AI copilot for appointment lookups & policy inquiries",
            ]}
          />

          <AppCard
            title="Platform Admin Dashboard"
            subtitle="Multi-tenant governance, merchant verification, PayPal onboarding status, cancellation policy amendments, and global audit ledger."
            audience="System Administrators & Operators"
            badge="Platform Control"
            badgeTone="emerald"
            icons={[ShieldCheck, Building2, PieChart]}
            metaHighlight={`${orgsCount} Multi-Tenant Organizations`}
            route={ROUTES.admin}
            actionLabel="Launch Platform Admin →"
            features={[
              "Multi-tenant salon directory & compliance onboarding verification",
              "Merchant cancellation policy amendment reviews & approval workflows",
              "Immutable audit ledger with PayPal Debug IDs & Webhook badges",
              "Platform commission telemetry & cross-organization dispute logs",
            ]}
          />
        </div>
      </main>

      <DemoToolbar />

      {isSandboxModalOpen && (
        <SandboxModal onClose={() => setIsSandboxModalOpen(false)} />
      )}
    </div>
  );
}
