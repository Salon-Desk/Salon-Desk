'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Key,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Layers,
  Copy,
  Check,
  Info,
  ChevronUp,
} from 'lucide-react';
import { SandboxModal } from './SandboxModal';
import { SANDBOX_CREDENTIALS, resetDemoState } from '@/lib/store';

interface DemoToolbarProps {
  onResetSuccess?: () => void;
}

export function DemoToolbar({ onResetSuccess }: DemoToolbarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCopy = (text: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      // 1. Call server API
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await res.json();

      // 2. Reset client-side state
      resetDemoState();

      if (onResetSuccess) {
        onResetSuccess();
      }

      setToastMessage(
        `Sandbox Re-seeded: ${data.stats?.activeHoldsCount || 2} Active Holds & Demo Data Restored!`
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      // Client-side fallback reset
      resetDemoState();
      setToastMessage('Local Demo State Reset Successfully');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Bottom Judge Utility Bar */}
      <aside
        aria-label="Demo environment controls"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-md py-2.5 px-4 sm:px-6"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs">
          {/* Left: Judge evaluation label & Quick Sandbox Credentials with Tooltip */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-bold text-slate-900">Judge Sandbox</span>
              <span className="hidden sm:inline text-slate-300">·</span>
              <span className="hidden sm:inline text-slate-500 font-medium">PayPal Authorization Holds</span>
            </div>

            {/* Quick Sandbox Credentials Tooltip Popover Container */}
            <div className="relative">
              <button
                onClick={() => setShowTooltip(!showTooltip)}
                onMouseEnter={() => setShowTooltip(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors font-medium whitespace-nowrap"
              >
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>Sandbox Credentials</span>
                <ChevronUp
                  className={`w-3 h-3 text-slate-500 transition-transform ${
                    showTooltip ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Tooltip Content */}
              {showTooltip && (
                <div
                  onMouseLeave={() => setShowTooltip(false)}
                  className="absolute bottom-full left-0 mb-2 w-80 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 space-y-3"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                      Quick Sandbox Accounts
                    </span>
                    <button
                      onClick={() => {
                        setShowTooltip(false);
                        setIsModalOpen(true);
                      }}
                      className="text-[10px] text-sky-600 hover:underline font-semibold"
                    >
                      View Full Specs →
                    </button>
                  </div>

                  {/* Buyer */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      Client Buyer Account
                    </span>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800">
                      <span className="truncate">{SANDBOX_CREDENTIALS.buyerAccount.email}</span>
                      <button
                        onClick={(e) =>
                          handleCopy(SANDBOX_CREDENTIALS.buyerAccount.email, 'tip-buyer', e)
                        }
                        className="ml-1.5 text-slate-400 hover:text-amber-600"
                        title="Copy email"
                      >
                        {copiedKey === 'tip-buyer' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Merchant */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      Salon Merchant Account
                    </span>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800">
                      <span className="truncate">{SANDBOX_CREDENTIALS.merchantAccount.email}</span>
                      <button
                        onClick={(e) =>
                          handleCopy(SANDBOX_CREDENTIALS.merchantAccount.email, 'tip-merchant', e)
                        }
                        className="ml-1.5 text-slate-400 hover:text-amber-600"
                        title="Copy email"
                      >
                        {copiedKey === 'tip-merchant' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 flex items-start gap-1">
                    <Info className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                    <span>Uses intent: AUTHORIZE (Funds held, zero deducted upfront)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Architecture & Stack Tags */}
          <div className="hidden xl:flex items-center gap-2 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              <Layers className="w-3 h-3 text-blue-600" /> Next.js 14 App Router
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              <ShieldCheck className="w-3 h-3 text-amber-600" /> PayPal Orders &amp; Payments v2
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              <Sparkles className="w-3 h-3 text-emerald-600" /> PayPal Agent Toolkit 1.11.0
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              Gemini AI
            </span>
          </div>

          {/* Right: Reset Demo Button */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 whitespace-nowrap"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting Sandbox...' : 'Reset Demo Environment'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Sandbox modal popup */}
      <SandboxModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
