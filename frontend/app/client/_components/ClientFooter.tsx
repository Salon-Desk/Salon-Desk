'use client'

import { ArrowUpRight, Building2, Lock, RotateCcw, Scissors, Shield, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { Logo } from '@/components/brand/logo'
import { BUYER_PERSONAS, type BuyerPersonaId, ROUTES } from '@/lib/constants'

interface ClientFooterProps {
  buyerPersona: BuyerPersonaId
  onTogglePersona: () => void
  onReset: () => void
  isResetting: boolean
}

export function ClientFooter({
  buyerPersona,
  onTogglePersona,
  onReset,
  isResetting,
}: ClientFooterProps) {
  const buyer = BUYER_PERSONAS[buyerPersona]

  return (
    <footer className="mt-20 border-t border-stone-200/80 bg-stone-50/70 text-stone-700">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 pb-12 border-b border-stone-200/60">
          {/* Col 1: Salon Identity */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <Logo theme="light" size="sm" linkToHome={false} />
              <span className="font-extrabold text-stone-900 text-sm tracking-tight">
                Crown & Blade Atelier
              </span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed max-w-sm">
              SoHo flagship hair design, skin fades, balayage, and restorative treatments. Reserve
              master stylists with $0 debited today through PayPal authorization holds.
            </p>
            <div className="pt-2 text-xs text-stone-500 space-y-1">
              <div>454 Broome Street, SoHo, New York, NY 10013</div>
              <div>Tue – Sat: 9:00 AM – 8:00 PM • Sun: 10:00 AM – 6:00 PM</div>
            </div>
          </div>

          {/* Col 2: Policy & Guarantee */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Booking Policy
            </div>
            <ul className="space-y-2 text-xs text-stone-600">
              <li className="flex items-start gap-2">
                <Lock className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                <span>$0 debited today (PayPal Authorization Hold)</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>100% hold release on cancellation ≥ 24h</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                <span>AI conversational scheduling & slot matching</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Reviewer & Sandbox Navigation */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Platform & Reviewer Tools
            </div>
            <p className="text-xs text-stone-500">
              Switch between demo personas, jump to other portals, or reset demo database state.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Persona Switcher */}
              <button
                type="button"
                onClick={onTogglePersona}
                title="Toggle Sandbox Buyer Account"
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Buyer: {buyer.shortLabel}</span>
                <span className="text-[10px] text-stone-400 underline ml-0.5">Switch</span>
              </button>

              {/* Reset Demo State */}
              <button
                type="button"
                onClick={onReset}
                disabled={isResetting}
                title="Reset Sandbox Demo State"
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw
                  className={`h-3 w-3 text-stone-500 ${isResetting ? 'animate-spin' : ''}`}
                />
                <span>Reset Demo</span>
              </button>
            </div>

            {/* Quick Portal Switcher Links */}
            <div className="flex items-center gap-3 pt-2 text-xs font-semibold">
              <Link
                href={ROUTES.hub}
                className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 transition-colors"
              >
                <span>App Hub</span>
                <ArrowUpRight className="h-3 w-3 text-stone-400" />
              </Link>
              <span className="text-stone-300">•</span>
              <Link
                href={ROUTES.merchant}
                className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 transition-colors"
              >
                <Scissors className="h-3 w-3 text-amber-600" />
                <span>Salon Console</span>
                <ArrowUpRight className="h-3 w-3 text-stone-400" />
              </Link>
              <span className="text-stone-300">•</span>
              <Link
                href={ROUTES.admin}
                className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 transition-colors"
              >
                <Building2 className="h-3 w-3 text-emerald-600" />
                <span>Platform Admin</span>
                <ArrowUpRight className="h-3 w-3 text-stone-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Micro-Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div>
            © 2026 Crown & Blade Atelier. Powered by{' '}
            <span className="font-semibold text-stone-800">SalonDesk</span>.
          </div>
          <div className="text-[11px] text-stone-400">
            PayPal Orders & Payments v2 (intent: AUTHORIZE) • Google Gemini 2.5
          </div>
        </div>
      </div>
    </footer>
  )
}
