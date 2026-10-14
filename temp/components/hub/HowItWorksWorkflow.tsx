'use client';

import React from 'react';
import { Bot, ShieldAlert, Scissors, CheckCheck, ArrowRight } from 'lucide-react';

export function HowItWorksWorkflow() {
  const steps = [
    {
      step: '01',
      title: 'AI Booking & Slot Negotiation',
      icon: Bot,
      accent: 'text-[#38BDF8] border-[#38BDF8]/30 bg-[#38BDF8]/10',
      description:
        'Client converses with the AI assistant or browses services. AI resolves stylist availability and calculates the required hold amount (e.g. $25 hold for a $65 service).',
    },
    {
      step: '02',
      title: 'PayPal Authorization Hold',
      icon: ShieldAlert,
      accent: 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10',
      description:
        'Client approves the hold via PayPal JS SDK v6 with intent: AUTHORIZE. Zero money is deducted today; funds are simply verified and reserved on their payment method.',
    },
    {
      step: '03',
      title: 'Appointment Time',
      icon: Scissors,
      accent: 'text-[#D97706] border-[#D97706]/30 bg-[#D97706]/10',
      description:
        'Client arrives at the salon for their service. If life happens, client can self-service cancel ≥24 hours prior, triggering an instant void with zero fees.',
    },
    {
      step: '04',
      title: '1-Click HITL Settlement',
      icon: CheckCheck,
      accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      description:
        'Staff clicks "Mark Show" to capture the full ticket, or "Mark No-Show" to capture only the agreed no-show fee (final_capture: true) releasing any excess hold.',
    },
  ];

  return (
    <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto border-b border-[#1E293B]">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-[#F59E0B]">
          How The Fintech Architecture Works
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          The 4-Step Authorization Hold Lifecycle
        </h2>
        <p className="text-xs sm:text-sm text-[#94A3B8] mt-2">
          Deterministic settlement controls prevent chargeback friction while guaranteeing merchant cash flow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="relative p-5 rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-[#334155] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-slate-500">
                    STEP {item.step}
                  </span>
                  <div className={`p-2 rounded-lg border ${item.accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {item.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-[#334155]">
                  <ArrowRight className="w-5 h-5 text-slate-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
