'use client'

import { Lock, Shield, Sparkles } from 'lucide-react'

import { Logo } from '@/components/brand'
import type { CatalogHero } from '@/types/api-org'

interface ClientFooterProps {
  hero?: CatalogHero | null
}

export function ClientFooter({ hero }: ClientFooterProps) {
  const brand = hero?.organization_name || 'SalonDesk'
  const address = hero?.physical_address

  return (
    <footer className="mt-20 border-t border-stone-200/80 bg-stone-50/70 text-stone-700">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-stone-200/60 pb-12 sm:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-6">
            <div className="flex items-center gap-2">
              <Logo theme="light" size="sm" linkToHome={false} />
              <span className="text-sm font-extrabold tracking-tight text-stone-900">{brand}</span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-stone-500">
              {hero?.subtitle ||
                'Book salon appointments with PayPal authorization holds. $0 debited today.'}
            </p>
            {address ? <p className="text-xs text-stone-500">{address}</p> : null}
          </div>

          <div className="space-y-3 lg:col-span-6">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Booking Policy
            </div>
            <ul className="space-y-2 text-xs text-stone-600">
              <li className="flex items-start gap-2">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>$0 debited today (PayPal authorization hold)</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>Hold release on cancellation within policy window</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>AI-assisted scheduling across partner salons</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-xs text-stone-500 sm:flex-row">
          <div>
            © 2026 {brand}. Powered by{' '}
            <span className="font-semibold text-stone-800">SalonDesk</span>.
          </div>
        </div>
      </div>
    </footer>
  )
}
