'use client'

import { Sparkles } from 'lucide-react'
import Link from 'next/link'

import { SandboxCredentialsIconButton } from '@/app/_components/SandboxCredentialsIconButton'
import { UserMenu } from '@/components/auth/user-menu'
import { Logo } from '@/components/brand'
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
    <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/90 pt-[env(safe-area-inset-top)] shadow-sm backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <Link href={ROUTES.client} className="flex min-w-0 shrink-0 items-center gap-2.5">
          <Logo theme="light" size="sm" linkToHome={false} />
        </Link>

        {/* Center: Desktop Tab Navigation */}
        <nav
          aria-label="Main"
          className="hidden md:flex items-center gap-1 rounded-full bg-stone-100 p-1"
        >
          <Link
            href={ROUTES.client}
            onClick={() => onTabChange('catalog')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-white text-stone-950 shadow-sm'
                : 'text-stone-500 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            Explore Services
          </Link>

          <Link
            href={ROUTES.clientBookings}
            onClick={() => onTabChange('my-bookings')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'my-bookings'
                ? 'bg-white text-stone-950 shadow-sm'
                : 'text-stone-500 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>My Bookings</span>
            {activeHoldsCount > 0 && (
              <span
                className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                  activeTab === 'my-bookings'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-500/20 text-amber-700'
                }`}
              >
                {activeHoldsCount}
              </span>
            )}
          </Link>
        </nav>

        {/* Right: AI Concierge + User Menu */}
        <div className="flex shrink-0 items-center gap-2">
          <SandboxCredentialsIconButton />
          <button
            type="button"
            onClick={onToggleConcierge}
            className={`hidden md:flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              conciergeOpen
                ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300/50'
                : 'bg-stone-950 text-white hover:bg-stone-800'
            }`}
          >
            <Sparkles
              className={`h-3.5 w-3.5 ${conciergeOpen ? 'text-white' : 'text-amber-400'}`}
            />
            <span>AI Chat</span>
          </button>

          <UserMenu portal="client" />
        </div>
      </div>
    </header>
  )
}
