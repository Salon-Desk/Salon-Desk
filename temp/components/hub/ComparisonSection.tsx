'use client';

import React from 'react';
import { Check, X, Shield, RefreshCw, AlertTriangle, Sparkles } from 'lucide-react';

export function ComparisonSection() {
  const comparisons = [
    {
      feature: 'Upfront Financial Impact for Client',
      traditional: 'Money immediately debited from bank/card upon booking',
      salondesk: '$0.00 debited. Funds are merely authorized & reserved',
      salondeskWin: true,
    },
    {
      feature: 'Refunds Upon Timely Cancellation',
      traditional: 'Requires manual merchant refund (3-5 business days) or store credit',
      salondesk: '1-click instant authorization void. Funds released immediately with $0 fees',
      salondeskWin: true,
    },
    {
      feature: 'No-Show Merchant Protection',
      traditional: 'Vulnerable to bank chargebacks ("service not received") and disputes',
      salondesk: 'Pre-authorized cryptographic consent allows partial fee capture with 1 click',
      salondeskWin: true,
    },
    {
      feature: 'Booking Conversion Friction',
      traditional: 'High abandonment (~38%) when clients see upfront debit fees',
      salondesk: 'High conversion (>89%) thanks to transparent "Hold, not a charge" guarantee',
      salondeskWin: true,
    },
    {
      feature: 'HITL Settlement Safeguard',
      traditional: 'Often automated without human verification or manual double-checks',
      salondesk: 'Salon staff explicitly confirm Show or No-Show before final settlement',
      salondeskWin: true,
    },
  ];

  return (
    <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto border-b border-[#1E293B]">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-[#38BDF8]">
          The Economic Paradigm Shift
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          Traditional Upfront Deposits vs. SalonDesk Authorization Holds
        </h2>
        <p className="text-xs sm:text-sm text-[#94A3B8] mt-2">
          Why top salon franchises and independent barbers are transitioning to non-debit authorization holds.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#334155] bg-[#0F172A]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#334155] bg-[#0A192F]">
              <th className="py-4 px-5 text-slate-300 font-semibold w-1/3">Core Dimension</th>
              <th className="py-4 px-5 text-red-300 font-semibold w-1/3">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Traditional Upfront Deposit</span>
                </div>
              </th>
              <th className="py-4 px-5 text-[#F59E0B] font-semibold w-1/3 bg-[#F59E0B]/5 border-l border-[#334155]">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                  <span>SalonDesk PayPal Hold Model</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {comparisons.map((row, i) => (
              <tr key={i} className="hover:bg-[#1E293B]/40 transition-colors">
                <td className="py-3.5 px-5 font-medium text-white">{row.feature}</td>
                <td className="py-3.5 px-5 text-slate-400">
                  <div className="flex items-start gap-2">
                    <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{row.traditional}</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-slate-200 bg-[#F59E0B]/5 border-l border-[#334155]">
                  <div className="flex items-start gap-2 font-medium">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{row.salondesk}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
