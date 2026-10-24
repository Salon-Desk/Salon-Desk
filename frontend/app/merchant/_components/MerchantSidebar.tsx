'use client'

import {
  Activity,
  Calendar,
  FileText,
  Lock,
  Receipt,
  Scissors,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react'

import { Logo } from '@/components/brand'
import { ConsoleSidebarNav, type SidebarTab } from '@/components/layout/console-sidebar-nav'
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
      id: 'billing',
      label: 'Billing',
      icon: Receipt,
      group: 'Salon Operations',
      href: MERCHANT_TAB_ROUTES.billing,
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
    <div className="flex h-full flex-col overflow-hidden bg-[#0A0E17] text-slate-200">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" showTagline={false} linkToHome theme="dark" />
          <div className="flex items-center gap-1.5">
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Merchant
            </span>
            {onCloseMobile ? (
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer transition-all active:scale-90"
                aria-label="Close navigation"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <ConsoleSidebarNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleNavChange}
        groups={MERCHANT_TAB_GROUPS}
        theme="dark"
      />

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onOpenCopilot}
          className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent px-3 py-2 text-xs font-semibold text-amber-200 transition-all hover:border-amber-400/50 hover:from-amber-500/20 hover:to-amber-500/10 active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>AI Copilot</span>
          </span>
          <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-amber-300/80 border border-white/5">
            ⌘K
          </span>
        </button>
      </div>

      <div className="mt-auto shrink-0 border-t border-white/[0.08] bg-[#070A11] p-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/25 to-amber-600/25 text-xs font-bold text-amber-200 ring-1 ring-amber-400/30">
              {salon.ownerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-200">{salon.name}</div>
              <div className="truncate text-[10px] font-medium text-slate-400 mt-0.5">
                {salon.ownerName} · Owner
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLockSession}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white/10 hover:text-white active:scale-95 cursor-pointer"
            title="Lock Session"
            aria-label="Lock session"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
