'use client'

import { Calendar, Search, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

import { ROUTES } from '@/lib/constants'

import type { ClientTab } from './ClientHeader'

export interface ClientExperienceMobileNavProps {
  activeTab: ClientTab
  isChatOpen: boolean
  onToggleChat: () => void
  isInputFocused: boolean
  activeHoldsCount: number
}

export function ClientExperienceMobileNav({
  activeTab,
  isChatOpen,
  onToggleChat,
  isInputFocused,
  activeHoldsCount,
}: ClientExperienceMobileNavProps) {
  const router = useRouter()
  const isCatalogActive = activeTab === 'catalog' && !isChatOpen
  const isAiActive = isChatOpen
  const isBookingsActive = activeTab === 'my-bookings' && !isChatOpen

  return (
    <nav
      aria-label="Mobile quick actions"
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm sm:max-w-md z-30 md:hidden flex items-center justify-between gap-1.5 rounded-full bg-gradient-to-b from-stone-900/95 via-stone-950/98 to-black/98 text-white p-1.5 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08),0_6px_24px_rgba(245,158,11,0.08)] backdrop-blur-2xl border border-white/[0.14] before:pointer-events-none before:absolute before:inset-x-8 before:-top-px before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-amber-400/50 before:to-transparent transition-all duration-300 ease-out ${
        isInputFocused
          ? 'opacity-0 translate-y-8 scale-95 pointer-events-none'
          : 'opacity-100 translate-y-0 scale-100'
      }`}
    >
      <button
        type="button"
        onClick={() => {
          router.push(ROUTES.client)
        }}
        className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all cursor-pointer select-none active:scale-[0.96] ${
          isCatalogActive
            ? 'bg-gradient-to-b from-white to-stone-100 text-stone-950 shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.9)]'
            : 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        <Search className="h-3.5 w-3.5" />
        <span>Catalog</span>
      </button>

      <button
        type="button"
        onClick={onToggleChat}
        className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all cursor-pointer select-none active:scale-[0.96] ${
          isAiActive
            ? 'bg-gradient-to-b from-white to-stone-100 text-stone-950 shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.9)]'
            : 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        <Sparkles
          className={`h-3.5 w-3.5 transition-transform ${isAiActive ? 'text-amber-500 scale-110' : 'text-amber-400'}`}
        />
        <span>Ask AI</span>
      </button>

      <button
        type="button"
        onClick={() => {
          router.push(ROUTES.clientBookings)
        }}
        className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all cursor-pointer select-none active:scale-[0.96] ${
          isBookingsActive
            ? 'bg-gradient-to-b from-white to-stone-100 text-stone-950 shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.9)]'
            : 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        <Calendar className="h-3.5 w-3.5" />
        <span className="flex items-center gap-1.5">
          Bookings
          {activeHoldsCount > 0 && (
            <span
              className={`h-4 min-w-4 px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center ${
                isBookingsActive
                  ? 'bg-amber-400 text-stone-950 shadow-xs'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {activeHoldsCount}
            </span>
          )}
        </span>
      </button>
    </nav>
  )
}
