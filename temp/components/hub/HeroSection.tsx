'use client';

import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Sparkles, Lock, ArrowDownRight } from 'lucide-react';

interface HeroSectionProps {
  onOpenSandboxModal: () => void;
}

export function HeroSection({ onOpenSandboxModal }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-[#1E293B]">
      {/* Ambient background glow & radial mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#F59E0B]/10 via-[#1D4ED8]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Core Breakthrough Highlight Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E293B]/80 border border-[#F59E0B]/40 text-xs text-[#FDE68A] shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
            <span className="font-medium text-center">
              Zero upfront risk for clients · 100% protection against no-shows via PayPal Authorization Holds
            </span>
          </div>
        </div>

        {/* Hero Visual Banner: Brand SVG Motif & Wordmark */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Logo Display */}
          <div className="relative w-full max-w-[540px] h-32 sm:h-40 mb-2">
            <Image
              src="/salondesk-deposits.svg"
              alt="SalonDesk Deposits Logo"
              fill
              className="object-contain filter drop-shadow-[0_8px_24px_rgba(245,158,11,0.2)]"
              priority
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Tagline */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mb-4 text-balance">
            A hold, not a charge:{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDE68A] via-[#F59E0B] to-[#D97706]">
              The AI-powered deposit ecosystem
            </span>{' '}
            for modern salons.
          </h1>

          <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl leading-relaxed mb-8">
            Traditional deposits frustrate clients with upfront charges and tedious refund disputes. 
            <strong className="text-white font-medium"> SalonDesk Deposits</strong> replaces upfront fees with secure{' '}
            <span className="text-[#F59E0B] font-semibold underline decoration-[#F59E0B]/40 underline-offset-4">
              PayPal Authorization Holds
            </span>
            . Clients book with zero upfront risk, while salon revenue is guaranteed against last-minute no-shows.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl mb-4">
            <div className="p-3 rounded-xl bg-[#0F172A] border border-[#1E293B] text-center">
              <div className="text-lg font-black text-[#38BDF8] tabular-nums">$0.00</div>
              <div className="text-[11px] text-[#94A3B8] font-medium">Upfront Charged</div>
            </div>
            <div className="p-3 rounded-xl bg-[#0F172A] border border-[#1E293B] text-center">
              <div className="text-lg font-black text-[#F59E0B] tabular-nums">100%</div>
              <div className="text-[11px] text-[#94A3B8] font-medium">No-Show Coverage</div>
            </div>
            <div className="p-3 rounded-xl bg-[#0F172A] border border-[#1E293B] text-center">
              <div className="text-lg font-black text-emerald-400 tabular-nums">≥ 24h</div>
              <div className="text-[11px] text-[#94A3B8] font-medium">Free Cancellation</div>
            </div>
            <div className="p-3 rounded-xl bg-[#0F172A] border border-[#1E293B] text-center">
              <div className="text-lg font-black text-white tabular-nums">1-Click</div>
              <div className="text-[11px] text-[#94A3B8] font-medium">HITL Settlement</div>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenSandboxModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs font-semibold text-slate-200 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Inspect PayPal Authorization Spec</span>
            </button>
            <a
              href="#app-launcher"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-black text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <span>Explore 3 Ecosystem Apps</span>
              <ArrowDownRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
