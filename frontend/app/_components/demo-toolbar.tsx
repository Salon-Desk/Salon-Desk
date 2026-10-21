'use client'

import { ChevronUp, Info, Key, Layers, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { CopyableValue } from '@/components/ui'
import { useClipboard } from '@/hooks'
import { SANDBOX_CREDENTIALS } from '@/lib/constants'

import { SandboxModal } from './SandboxModal'

export function DemoToolbar() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const { copiedKey, copy } = useClipboard()

  return (
    <>
      <aside
        aria-label="Sandbox credentials"
        className="fixed inset-x-0 bottom-0 z-40 border-slate-200 border-t bg-white/95 px-4 py-2.5 shadow-md backdrop-blur-md sm:px-6"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2.5 text-xs md:flex-row">
          <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-start">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="font-bold text-slate-900">Sandbox</span>
              <span className="hidden text-slate-300 sm:inline">·</span>
              <span className="hidden font-medium text-slate-500 sm:inline">
                PayPal Authorization Holds
              </span>
            </div>

            {/* Hover dismisses the credentials popover once the pointer leaves both trigger and panel. */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: popover grouping */}
            <div className="relative" onMouseLeave={() => setShowTooltip(false)}>
              <button
                type="button"
                onClick={() => setShowTooltip((open) => !open)}
                onMouseEnter={() => setShowTooltip(true)}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 font-medium text-slate-800 transition-colors hover:bg-slate-200"
              >
                <Key className="h-3.5 w-3.5 text-amber-600" />
                <span>Sandbox Credentials</span>
                <ChevronUp
                  className={`h-3 w-3 text-slate-500 transition-transform ${showTooltip ? 'rotate-180' : ''}`}
                />
              </button>

              {showTooltip && (
                <div className="absolute bottom-full left-0 z-50 mb-2 w-80 animate-in space-y-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between border-slate-100 border-b pb-1.5">
                    <span className="font-bold text-[11px] text-slate-900 uppercase tracking-wider">
                      Quick Sandbox Accounts
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTooltip(false)
                        setIsModalOpen(true)
                      }}
                      className="font-semibold text-[10px] text-sky-600 hover:underline"
                    >
                      View Full Specs →
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="block font-semibold text-[10px] text-slate-500">
                      Client Buyer Account
                    </span>
                    <CopyableValue
                      value={SANDBOX_CREDENTIALS.buyerAccount.email}
                      copyKey="tip-buyer"
                      copiedKey={copiedKey}
                      onCopy={copy}
                      className="bg-slate-50 p-1.5 text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="block font-semibold text-[10px] text-slate-500">
                      Salon Merchant Account
                    </span>
                    <CopyableValue
                      value={SANDBOX_CREDENTIALS.merchantAccount.email}
                      copyKey="tip-merchant"
                      copiedKey={copiedKey}
                      onCopy={copy}
                      className="bg-slate-50 p-1.5 text-[11px]"
                    />
                  </div>

                  <div className="flex items-start gap-1 rounded border border-amber-200 bg-amber-50 p-1.5 text-[10px] text-amber-800">
                    <Info className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                    <span>Uses intent: AUTHORIZE (Funds held, zero deducted upfront)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden items-center gap-2 text-[11px] text-slate-600 xl:flex">
            <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5">
              <Layers className="h-3 w-3 text-blue-600" /> {SANDBOX_CREDENTIALS.techStack.framework}
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5">
              <ShieldCheck className="h-3 w-3 text-amber-600" />{' '}
              {SANDBOX_CREDENTIALS.techStack.paypalApi}
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5">
              <Sparkles className="h-3 w-3 text-emerald-600" />{' '}
              {SANDBOX_CREDENTIALS.techStack.agentToolkit}
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-2 py-0.5">
              Gemini AI
            </span>
          </div>
        </div>
      </aside>

      {isModalOpen && <SandboxModal onClose={() => setIsModalOpen(false)} />}
    </>
  )
}
