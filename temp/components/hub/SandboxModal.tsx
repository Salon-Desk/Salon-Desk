'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Shield, User, Store, KeyRound, ExternalLink, Code2 } from 'lucide-react';
import { SANDBOX_CREDENTIALS } from '@/lib/store';

interface SandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SandboxModal({ isOpen, onClose }: SandboxModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'credentials' | 'payload'>('credentials');

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sampleAuthPayload = {
    intent: 'AUTHORIZE',
    purchase_units: [
      {
        reference_id: 'SD-8491',
        amount: {
          currency_code: 'USD',
          value: '25.00',
        },
        description: 'SalonDesk Authorization Hold: Precision Fade & Hot Towel Beard',
        payee: {
          merchant_id: 'MERCHANT_CROWN_7781',
        },
      },
    ],
    application_context: {
      brand_name: 'SalonDesk Deposits',
      user_action: 'CONTINUE',
      shipping_preference: 'NO_SHIPPING',
    },
  };

  const sampleNoShowPayload = {
    amount: {
      currency_code: 'USD',
      value: '20.00',
    },
    final_capture: true,
    note_to_payer: 'No-show fee retained as per 24h salon policy. Excess hold released.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Hackathon Judge &amp; Sandbox Credentials</h2>
              <p className="text-xs text-slate-500">Ready-to-use PayPal sandbox test accounts &amp; API payloads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'credentials'
                ? 'text-amber-600 border-amber-600'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            Sandbox Accounts
          </button>
          <button
            onClick={() => setActiveTab('payload')}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'payload'
                ? 'text-amber-600 border-amber-600'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Authorization Payloads (`intent: AUTHORIZE`)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'credentials' ? (
            <>
              {/* Buyer Account Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Client / Buyer Sandbox Account
                    </span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-sky-100 text-sky-700 font-semibold border border-sky-200">
                    Pre-Funded Mock Buyer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-medium">Email / Username</label>
                    <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 font-mono text-slate-800">
                      <span className="truncate">{SANDBOX_CREDENTIALS.buyerAccount.email}</span>
                      <button
                        onClick={() => handleCopy(SANDBOX_CREDENTIALS.buyerAccount.email, 'buyer-email')}
                        className="ml-2 text-slate-400 hover:text-amber-600"
                      >
                        {copiedKey === 'buyer-email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-medium">Password</label>
                    <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 font-mono text-slate-800">
                      <span>{SANDBOX_CREDENTIALS.buyerAccount.password}</span>
                      <button
                        onClick={() => handleCopy(SANDBOX_CREDENTIALS.buyerAccount.password, 'buyer-pass')}
                        className="ml-2 text-slate-400 hover:text-amber-600"
                      >
                        {copiedKey === 'buyer-pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Name: {SANDBOX_CREDENTIALS.buyerAccount.name}</span>
                  <span>Payment Card: {SANDBOX_CREDENTIALS.buyerAccount.card}</span>
                </div>
              </div>

              {/* Merchant Account Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Salon Merchant Sandbox Account
                    </span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                    Flagship SoHo Salon
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-medium">Merchant Email</label>
                    <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 font-mono text-slate-800">
                      <span className="truncate">{SANDBOX_CREDENTIALS.merchantAccount.email}</span>
                      <button
                        onClick={() => handleCopy(SANDBOX_CREDENTIALS.merchantAccount.email, 'merchant-email')}
                        className="ml-2 text-slate-400 hover:text-amber-600"
                      >
                        {copiedKey === 'merchant-email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 font-medium">Merchant Password</label>
                    <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 font-mono text-slate-800">
                      <span>{SANDBOX_CREDENTIALS.merchantAccount.password}</span>
                      <button
                        onClick={() => handleCopy(SANDBOX_CREDENTIALS.merchantAccount.password, 'merchant-pass')}
                        className="ml-2 text-slate-400 hover:text-amber-600"
                      >
                        {copiedKey === 'merchant-pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Salon: {SANDBOX_CREDENTIALS.merchantAccount.salonName}</span>
                  <span>ID: {SANDBOX_CREDENTIALS.merchantAccount.merchantId}</span>
                </div>
              </div>

              {/* Core Fintech Rule Banner */}
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <span className="font-bold text-amber-800 block">
                    Fintech Rule: Authorization Hold Model
                  </span>
                  <p className="leading-relaxed">
                    All customer checkout flows enforce <code className="font-mono text-amber-900 bg-amber-100 px-1 py-0.5 rounded font-bold">intent: &apos;AUTHORIZE&apos;</code>.
                    No money leaves the client&apos;s account at booking time. Funds are securely locked on their card and captured only upon service completion or no-show penalty.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-sky-700">
                    1. Deposit Hold Creation (`POST /v2/checkout/orders`)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">intent: AUTHORIZE</span>
                </div>
                <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-100 overflow-x-auto">
                  {JSON.stringify(sampleAuthPayload, null, 2)}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-700">
                    2. No-Show Fee Partial Capture (`POST /v2/payments/authorizations/&#123;id&#125;/capture`)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">final_capture: true</span>
                </div>
                <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-100 overflow-x-auto">
                  {JSON.stringify(sampleNoShowPayload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
          <span className="text-xs text-slate-500">
            PayPal Sandbox developer portal:{' '}
            <a
              href="https://developer.paypal.com"
              target="_blank"
              rel="noreferrer"
              className="text-sky-600 font-medium hover:underline inline-flex items-center gap-1"
            >
              developer.paypal.com <ExternalLink className="w-3 h-3" />
            </a>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
