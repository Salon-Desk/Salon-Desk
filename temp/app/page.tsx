'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/hub/Header';
import { AppCard } from '@/components/hub/AppCard';
import { DemoToolbar } from '@/components/hub/DemoToolbar';
import { SandboxModal } from '@/components/hub/SandboxModal';
import { Logo } from '@/components/brand/Logo';
import { getStoredState, AppStoreData } from '@/lib/store';
import {
  Sparkles,
  Calendar,
  MessageSquare,
  Scissors,
  Clock,
  CalendarRange,
  ShieldCheck,
  Building2,
  PieChart,
} from 'lucide-react';

export default function HubPage() {
  const [store, setStore] = useState<AppStoreData>(() => getStoredState());
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setStore(getStoredState());
    window.addEventListener('salondesk_store_updated', handleUpdate);
    return () => window.removeEventListener('salondesk_store_updated', handleUpdate);
  }, []);

  const activeHoldsCount = store?.bookings.filter((b) => b.status === 'HELD').length ?? 2;
  const capturedCount = store?.bookings.filter((b) => b.status === 'CAPTURED').length ?? 1;
  const orgsCount = store?.organizations.length ?? 3;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 selection:bg-amber-500/20 selection:text-amber-900">
      {/* Top Header */}
      <Header onOpenSandboxModal={() => setIsSandboxModalOpen(true)} />

      {/* Main Hero & App Cards Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-16">
        {/* App Name & Branding Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10">
          {/* Logo & Wordmark */}
          <div className="mb-4">
            <Logo size="lg" showTagline={false} linkToHome={false} theme="light" />
          </div>

          {/* Tagline */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            A hold, not a charge:{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700">
              The AI-powered deposit ecosystem
            </span>{' '}
            for modern salons.
          </h1>

          {/* Value Prop Callout */}
          <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Zero upfront risk for clients · 100% protection against no-shows via PayPal Authorization Holds</span>
          </div>
        </div>

        {/* 3 Core Application Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Client Booking Application */}
          <AppCard
            title="Client Booking Experience"
            subtitle="Mobile-optimized salon discovery, conversational AI booking assistant, and PayPal non-debit authorization hold checkout."
            role="Salon Clients & Customers"
            badge="Client Experience"
            badgeVariant="blue"
            icons={[Sparkles, Calendar, MessageSquare]}
            metaHighlight="Sandbox Buyer • Jane Doe"
            route="/client"
            actionLabel="Launch Client Experience →"
            features={[
              'Conversational AI booking agent with natural-language slot picker',
              'Seamless PayPal JS SDK v6 authorization hold (intent: AUTHORIZE)',
              'Instant self-service booking cancellation & policy window protection',
              '$0.00 debited today guarantee with cryptographic consent hash',
            ]}
          />

          {/* Card 2: Organization Portal (Merchant Console) */}
          <AppCard
            title="Organization Portal"
            subtitle="Real-time salon operations console, status-coded schedule timeline, and 1-click Human-in-the-Loop settlement actions."
            role="Salon Owners, Stylists & Receptionists"
            badge="Salon Management"
            badgeVariant="amber"
            icons={[Scissors, Clock, CalendarRange]}
            metaHighlight={`Crown & Blade Atelier • ${activeHoldsCount} Active Holds`}
            route="/merchant"
            actionLabel="Launch Salon Dashboard →"
            features={[
              'Schedule timeline color-coded by hold state (Amber, Green, Red, Slate)',
              '1-Click HITL controls: Mark Show (capture full) & Mark No-Show (fee-only)',
              'Idempotent payment safeguards preventing duplicate captures',
              'Integrated salon AI copilot for appointment lookups & policy inquiries',
            ]}
          />

          {/* Card 3: Platform Admin Dashboard */}
          <AppCard
            title="Platform Admin Dashboard"
            subtitle="Multi-tenant governance, merchant verification, PayPal onboarding status, cancellation policy amendments, and global audit ledger."
            role="System Administrators & Operators"
            badge="Platform Control"
            badgeVariant="emerald"
            icons={[ShieldCheck, Building2, PieChart]}
            metaHighlight={`${orgsCount} Multi-Tenant Organizations`}
            route="/admin"
            actionLabel="Launch Platform Admin →"
            features={[
              'Multi-tenant salon directory & compliance onboarding verification',
              'Merchant cancellation policy amendment reviews & approval workflows',
              'Immutable audit ledger with PayPal Debug IDs & Webhook badges',
              'Platform commission telemetry & cross-organization dispute logs',
            ]}
          />
        </div>
      </main>

      {/* Sticky Judge & Demo Utility Toolbar */}
      <DemoToolbar onResetSuccess={() => setStore(getStoredState())} />

      {/* Sandbox modal popup */}
      <SandboxModal isOpen={isSandboxModalOpen} onClose={() => setIsSandboxModalOpen(false)} />
    </div>
  );
}
