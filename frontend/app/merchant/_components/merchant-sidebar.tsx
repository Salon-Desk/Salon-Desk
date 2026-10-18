'use client'

import {
  Activity,
  Calendar,
  FileText,
  Lock,
  Scissors,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'

import { Logo } from '@/components/brand/logo'
import { ConsoleSidebarNav, type SidebarTab } from '@/components/layout/console-sidebar-nav'
import { ROUTES } from '@/lib/constants'
import type { MerchantSalonInfo } from '@/lib/data/merchant'

import type { MerchantTab } from '../_types/merchant-types'
import { MERCHANT_TAB_GROUPS, MERCHANT_TAB_ROUTES } from '../_types/merchant-types'

interface MerchantSidebarProps {
  salon: MerchantSalonInfo
  activeTab: MerchantTab
  activeHoldsCount: number
  bookingsCount: number
  staffCount: number
  servicesCount: number
  pendingChangeRequests: number
  onTabChange?: (tab: MerchantTab) => void
  onOpenCopilot: () => void
  onLockSession: () => void
  onCloseMobile?: () => void
}

export function MerchantSidebar({
  salon,
  activeTab,
  activeHoldsCount,
  bookingsCount,
  staffCount,
  servicesCount,
  pendingChangeRequests,
  onTabChange,
  onOpenCopilot,
  onLockSession,
  onCloseMobile,
}: MerchantSidebarProps) {
  const tabs: SidebarTab<MerchantTab>[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Activity,
      group: 'Salon Operations',
      badge: activeHoldsCount,
      isAlert: true,
      href: MERCHANT_TAB_ROUTES.dashboard,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      group: 'Salon Operations',
      badge: activeHoldsCount,
      isAlert: true,
      href: MERCHANT_TAB_ROUTES.calendar,
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: FileText,
      group: 'Salon Operations',
      badge: bookingsCount,
      href: MERCHANT_TAB_ROUTES.appointments,
    },
    {
      id: 'staff',
      label: 'Staff',
      icon: Users,
      group: 'Salon Configuration',
      badge: staffCount,
      href: MERCHANT_TAB_ROUTES.staff,
    },
    {
      id: 'services',
      label: 'Services',
      icon: Scissors,
      group: 'Salon Configuration',
      badge: servicesCount,
      href: MERCHANT_TAB_ROUTES.services,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      group: 'Salon Configuration',
      badge: pendingChangeRequests,
      isAlert: true,
      href: MERCHANT_TAB_ROUTES.settings,
    },
  ]

  const handleNavChange = (tab: MerchantTab) => {
    onTabChange?.(tab)
    onCloseMobile?.()
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-[#0F1423] via-[#0B101A] via-[#080C14] to-[#04070C] text-slate-200">
      {/* Ambient atmospheric top lighting */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-gradient-to-b from-amber-500/20 via-amber-500/10 to-transparent blur-3xl"
        aria-hidden="true"
      />
      {/* Subtle purple accent glow */}
      <div
        className="pointer-events-none absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-gradient-to-l from-indigo-500/5 via-purple-500/3 to-transparent blur-3xl"
        aria-hidden="true"
      />
      {/* Subtle bottom glow */}
      <div
        className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-gradient-to-t from-slate-500/5 to-transparent blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent px-5 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Logo size="sm" showTagline={false} linkToHome theme="dark" />
          <span className="rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-200 ring-1 ring-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.2)]">
            Merchant
          </span>
        </div>
        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden cursor-pointer transition-all active:scale-95"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="relative mx-4 mt-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.15] via-amber-500/[0.08] to-transparent p-4 shadow-[inset_0_1px_0_0_rgba(251,191,36,0.1),0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white tracking-wide">{salon.name}</p>
            <p className="truncate text-[11px] font-medium text-slate-400 mt-0.5">
              {activeHoldsCount} active {activeHoldsCount === 1 ? 'hold' : 'holds'}
            </p>
          </div>
          <span className="shrink-0 rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-amber-600/15 px-2.5 py-1 font-mono text-[10px] font-bold text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            {salon.commissionRate}%
          </span>
        </div>
      </div>

      <ConsoleSidebarNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleNavChange}
        groups={MERCHANT_TAB_GROUPS}
        theme="dark"
      />

      <div className="relative space-y-2.5 px-4 pb-4">
        <button
          type="button"
          onClick={onOpenCopilot}
          className="group relative flex w-full items-center justify-between rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-500/8 px-4 py-3 text-xs font-semibold text-amber-100 shadow-[inset_0_1px_0_0_rgba(251,191,36,0.3),0_4px_20px_rgba(245,158,11,0.12)] transition-all hover:border-amber-400/60 hover:from-amber-500/25 hover:to-amber-500/12 hover:shadow-[inset_0_1px_0_0_rgba(251,191,36,0.35),0_6px_24px_rgba(245,158,11,0.18)] active:scale-[0.97] cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
            <span>AI Copilot</span>
          </span>
          <span className="text-[10px] font-mono text-amber-300/90 bg-black/20 px-1.5 py-0.5 rounded">
            ⌘K
          </span>
        </button>

        <div className="space-y-1.5 border-t border-white/[0.06] pt-3">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Switch portal
          </p>
          <Link
            href={ROUTES.admin}
            className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white hover:translate-x-1 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] cursor-pointer"
          >
            <span className="flex items-center gap-2">Admin</span>
            <span className="text-[10px] text-slate-500 group-hover:text-amber-400 transition-colors">
              →
            </span>
          </Link>
          <Link
            href={ROUTES.client}
            className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white hover:translate-x-1 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] cursor-pointer"
          >
            <span className="flex items-center gap-2">Client</span>
            <span className="text-[10px] text-slate-500 group-hover:text-amber-400 transition-colors">
              →
            </span>
          </Link>
        </div>
      </div>

      <div className="relative mt-auto shrink-0 border-t border-white/[0.08] bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-3 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_6px_24px_rgba(0,0,0,0.35)]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 to-amber-600/30 text-xs font-bold text-amber-100 ring-1 ring-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              {salon.ownerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-100">{salon.ownerName}</div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">Owner</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLockSession}
            className="shrink-0 rounded-xl p-2 text-slate-400 transition-all hover:bg-white/10 hover:text-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)] active:scale-95 cursor-pointer"
            title="Lock Session"
            aria-label="Lock session"
          >
            <Lock className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
