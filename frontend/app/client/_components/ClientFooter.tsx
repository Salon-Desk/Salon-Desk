'use client'

import { Lock, Shield, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { Logo } from '@/components/brand'
import { ROUTES } from '@/lib/constants'
import type { CatalogHero } from '@/types/api-org'

interface ClientFooterProps {
  hero?: CatalogHero | null
  /** Reserves room for the fixed mobile navigation when it is present above the footer. */
  hasMobileNav?: boolean
}

export function ClientFooter({ hero, hasMobileNav = false }: ClientFooterProps) {
  const brand = hero?.organization_name || 'SalonDesk'
  const address = hero?.physical_address

  return (
    <footer className="border-t border-stone-200/80 bg-stone-50/60 text-stone-700">
      <div
        className={`mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:py-12 lg:px-8 ${
          hasMobileNav ? 'pb-[calc(7rem+env(safe-area-inset-bottom))]' : 'pb-10'
        }`}
      >
        <div className="grid grid-cols-1 gap-10 border-b border-stone-200/60 pb-10 sm:grid-cols-3 lg:grid-cols-12">
          {/* Brand column */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-5">
            <div className="flex items-center gap-2">
              <Logo theme="light" size="sm" linkToHome={false} />
              <span className="text-sm font-extrabold tracking-tight text-stone-900">{brand}</span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-stone-500">
              {hero?.subtitle ||
                'Book salon appointments with PayPal authorization holds. $0 debited today.'}
            </p>
            {address ? <p className="text-xs text-stone-400">{address}</p> : null}
          </div>

          {/* Booking policy */}
          <div className="space-y-3 lg:col-span-4">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Booking Policy
            </div>
            <ul className="space-y-2 text-xs text-stone-500">
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

          {/* Nav links */}
          <div className="space-y-3 lg:col-span-3">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Navigate
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href={ROUTES.client}
                  className="text-stone-500 transition-colors hover:text-amber-700"
                >
                  Explore Services
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.clientBookings}
                  className="text-stone-500 transition-colors hover:text-amber-700"
                >
                  My Bookings
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.clientExplore}
                  className="text-stone-500 transition-colors hover:text-amber-700"
                >
                  Explore All Treatments
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 pt-6 text-xs text-stone-400 sm:flex-row">
          <span>
            © 2026 {brand}. Powered by{' '}
            <span className="font-semibold text-stone-600">SalonDesk</span>.
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-amber-500" />
            PayPal Secured · $0 today
          </span>
        </div>
      </div>
    </footer>
  )
}
