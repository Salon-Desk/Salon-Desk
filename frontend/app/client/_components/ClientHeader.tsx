'use client'

import { Sparkles } from 'lucide-react'
import Link from 'next/link'

import { UserMenu } from '@/components/auth/user-menu'
import { Logo } from '@/components/brand/logo'
import { ROUTES } from '@/lib/constants'

export type ClientTab = 'catalog' | 'my-bookings'

interface ClientHeaderProps {
  activeTab: ClientTab
  onTabChange: (tab: ClientTab) => void
  activeHoldsCount: number
  conciergeOpen: boolean
  onToggleConcierge: () => void
}

export function ClientHeader({
  activeTab,
  onTabChange,
  activeHoldsCount,
  conciergeOpen,
  onToggleConcierge,
}: ClientHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        {/* Left Side: Boutique Logo */}
        <Link href={ROUTES.client} className="flex min-w-0 shrink items-center gap-2.5">
          <Logo theme="light" size="sm" linkToHome={false} />
        </Link>

        {/* Center: Desktop Navigation Tabs (Clean minimal underline / soft pills) */}
        <nav aria-label="Main" className="hidden md:flex items-center gap-1">
          <Link
            href={ROUTES.client}
            onClick={() => onTabChange('catalog')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-stone-950 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Explore Services
          </Link>

          <Link
            href={ROUTES.clientBookings}
            onClick={() => onTabChange('my-bookings')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my-bookings'
                ? 'bg-stone-950 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <span>My Bookings</span>
            {activeHoldsCount > 0 && (
              <span
                className={`h-4 min-w-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                  activeTab === 'my-bookings'
                    ? 'bg-amber-400 text-stone-950'
                    : 'bg-stone-200 text-stone-800'
                }`}
              >
                {activeHoldsCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Right Side: My Bookings indicator (mobile) & AI Concierge Pill */}
        <div className="flex shrink-0 items-center gap-2">
          {/* AI Concierge Luxury Button (mobile uses the bottom bar) */}
          <button
            type="button"
            onClick={onToggleConcierge}
            className={`hidden md:flex items-center gap-1.5 rounded-full bg-stone-950 hover:bg-stone-800 text-white font-medium px-4 py-2 text-xs transition-all cursor-pointer ${
              conciergeOpen ? 'ring-2 ring-amber-400/60' : ''
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Chat</span>
          </button>

          <UserMenu portal="client" />
        </div>
      </div>
    </header>
  )
}
