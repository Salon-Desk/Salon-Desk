'use client'

import {
  Activity,
  Calendar,
  FileText,
  Lock,
  RotateCcw,
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
  isResetting: boolean
  onTabChange?: (tab: MerchantTab) => void
  onOpenCopilot: () => void
  onLockSession: () => void
  onResetDemo: () => void
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
  isResetting,
  onTabChange,
  onOpenCopilot,
  onLockSession,
  onResetDemo,
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
    <div className="flex h-full flex-col overflow-hidden bg-[#0B0F17] text-slate-200">
      {/* Brand Header */}
      <div className="flex shrink-0 items-center justify-between border-slate-800/80 border-b px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" showTagline={false} linkToHome theme="dark" />
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-bold font-mono text-[9px] text-amber-300 uppercase tracking-wider">
            Merchant
          </span>
        </div>
        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Salon Identification Badge */}
      <div className="mx-3 mt-3 flex shrink-0 items-center justify-between rounded-xl border border-slate-800/90 bg-slate-900/60 px-3 py-2 text-xs">
        <div className="flex min-w-0 items-center gap-2 truncate">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <div className="min-w-0 truncate text-left">
            <div className="truncate font-semibold text-slate-100 text-xs">{salon.name}</div>
          </div>
        </div>
        <span className="shrink-0 font-mono text-[9px] text-amber-300 font-bold bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
          {salon.commissionRate}% VIP
        </span>
      </div>

      {/* Navigation */}
      <ConsoleSidebarNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleNavChange}
        groups={MERCHANT_TAB_GROUPS}
        theme="dark"
      />

      {/* Copilot Action & Cross-Portal Links */}
      <div className="space-y-3 px-3 pb-3">
        <button
          type="button"
          onClick={onOpenCopilot}
          className="group flex w-full items-center justify-between rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent px-3 py-2 text-xs font-semibold text-amber-200 transition-all hover:border-amber-400/60 hover:text-white hover:shadow-xs active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 transition-transform group-hover:rotate-12" />
            <span>AI Copilot</span>
          </span>
          <span className="font-mono text-[10px] text-amber-300/80 font-medium bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded">
            Cmd+K
          </span>
        </button>

        {/* Portals Switcher */}
        <div className="space-y-1 border-slate-800/80 border-t pt-2.5">
          <span className="block px-2 pb-0.5 font-bold text-[10px] text-slate-500 uppercase tracking-wider">
            Portals
          </span>
          <Link
            href={ROUTES.admin}
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 font-medium text-slate-400 text-xs transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <span>Platform Admin</span>
            <span className="font-mono text-[10px] text-slate-500">/admin</span>
          </Link>
          <Link
            href={ROUTES.client}
            className="flex items-center justify-between rounded-lg px-2.5 py-1.5 font-medium text-slate-400 text-xs transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <span>Client Booking</span>
            <span className="font-mono text-[10px] text-slate-500">/client</span>
          </Link>
        </div>
      </div>

      {/* User Footer */}
      <div className="mt-auto shrink-0 space-y-2 border-slate-800/80 border-t bg-slate-900/40 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 font-bold text-amber-300 text-xs">
              {salon.ownerName.charAt(0)}
            </div>
            <div className="overflow-hidden text-left">
              <div className="truncate font-semibold text-slate-200 text-xs">{salon.ownerName}</div>
              <div className="text-[10px] text-slate-500">Owner</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLockSession}
            className="rounded-lg border border-slate-800 bg-slate-800/80 p-1 text-slate-400 shadow-xs transition-colors hover:bg-slate-700 hover:text-white"
            title="Lock Session"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onResetDemo}
          disabled={isResetting}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-900/80 px-2.5 py-1.5 font-medium text-slate-400 text-xs transition-all hover:bg-slate-800 hover:text-slate-200 disabled:opacity-60"
        >
          <RotateCcw className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
          Reset Demo Data
        </button>
      </div>
    </div>
  )
}
