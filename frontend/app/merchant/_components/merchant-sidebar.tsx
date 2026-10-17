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
    <div className="flex h-full flex-col overflow-hidden bg-[#080B12] text-slate-200">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-4">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" showTagline={false} linkToHome theme="dark" />
          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/20">
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

      <div className="mx-3 mt-3 rounded-2xl border border-white/5 bg-gradient-to-br from-amber-500/10 to-transparent px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">{salon.name}</p>
            <p className="truncate text-[10px] text-slate-500">{activeHoldsCount} active holds</p>
          </div>
          <span className="shrink-0 rounded-md border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300">
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

      <div className="space-y-2 px-3 pb-3">
        <button
          type="button"
          onClick={onOpenCopilot}
          className="flex w-full items-center justify-between rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-xs font-semibold text-amber-100 transition-all hover:border-amber-400/50 hover:bg-amber-500/15"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            AI Copilot
          </span>
        </button>

        <div className="space-y-1 border-t border-white/5 pt-2">
          <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Switch portal
          </p>
          <Link
            href={ROUTES.admin}
            className="flex rounded-xl px-2.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Admin
          </Link>
          <Link
            href={ROUTES.client}
            className="flex rounded-xl px-2.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Client
          </Link>
        </div>
      </div>

      <div className="mt-auto shrink-0 border-t border-white/5 bg-black/20 p-3">
        <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-2.5 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-200">
              {salon.ownerName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-100">{salon.ownerName}</div>
              <div className="text-[10px] text-slate-500">Owner</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLockSession}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            title="Lock Session"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
