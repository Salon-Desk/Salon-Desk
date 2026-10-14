'use client'

import {
  Building2,
  Layers,
  Lock,
  Percent,
  PieChart,
  RotateCcw,
  Sliders,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'

import { Logo } from '@/components/brand/logo'
import { ConsoleSidebarNav, type SidebarTab } from '@/components/layout/console-sidebar-nav'
import { ROUTES } from '@/lib/constants'
import type { PlatformUser } from '@/types'

import { ADMIN_NAV_GROUPS, ADMIN_TAB_LABELS, ADMIN_TAB_ROUTES } from '../_constants/admin-nav'
import type { AdminTabId } from '../_types/admin-types'

interface AdminSidebarProps {
  activeTab: AdminTabId
  onTabChange?: (tab: AdminTabId) => void
  onCloseMobile?: () => void
  organizationCount: number
  categoryCount: number
  staffCount: number
  pendingCrCount: number
  pendingSalonCount: number
  currentUser: PlatformUser
  onLockSession: () => void
  onResetDemo: () => void
  isResetting: boolean
}

export function AdminSidebar({
  activeTab,
  onTabChange,
  onCloseMobile,
  organizationCount,
  categoryCount,
  staffCount,
  pendingCrCount,
  pendingSalonCount,
  currentUser,
  onLockSession,
  onResetDemo,
  isResetting,
}: AdminSidebarProps) {
  const tabs: SidebarTab<AdminTabId>[] = [
    {
      id: 'overview',
      label: ADMIN_TAB_LABELS.overview,
      icon: PieChart,
      group: ADMIN_NAV_GROUPS[0],
      href: ADMIN_TAB_ROUTES.overview,
    },
    {
      id: 'salons',
      label: ADMIN_TAB_LABELS.salons,
      icon: Building2,
      group: ADMIN_NAV_GROUPS[1],
      badge: pendingSalonCount > 0 ? pendingSalonCount : organizationCount,
      isAlert: pendingSalonCount > 0,
      href: ADMIN_TAB_ROUTES.salons,
    },
    {
      id: 'requests',
      label: ADMIN_TAB_LABELS.requests,
      icon: Sliders,
      group: ADMIN_NAV_GROUPS[1],
      badge: pendingCrCount,
      isAlert: pendingCrCount > 0,
      href: ADMIN_TAB_ROUTES.requests,
    },
    {
      id: 'commission',
      label: ADMIN_TAB_LABELS.commission,
      icon: Percent,
      group: ADMIN_NAV_GROUPS[2],
      href: ADMIN_TAB_ROUTES.commission,
    },
    {
      id: 'taxonomy',
      label: ADMIN_TAB_LABELS.taxonomy,
      icon: Layers,
      group: ADMIN_NAV_GROUPS[3],
      badge: categoryCount,
      href: ADMIN_TAB_ROUTES.taxonomy,
    },
    {
      id: 'staff',
      label: ADMIN_TAB_LABELS.staff,
      icon: Users,
      group: ADMIN_NAV_GROUPS[3],
      badge: staffCount,
      href: ADMIN_TAB_ROUTES.staff,
    },
  ]

  const initials = currentUser.name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const displayName = currentUser.name.replace(' (Judge Demo)', '')

  const handleNavChange = (tab: AdminTabId) => {
    onTabChange?.(tab)
    onCloseMobile?.()
  }

  return (
    <div className="flex h-full flex-col bg-[#0B0F17] text-slate-200 overflow-hidden">
      {/* Brand Header */}
      <div className="flex shrink-0 items-center justify-between border-slate-800/80 border-b px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" showTagline={false} linkToHome theme="dark" />
          <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 font-bold font-mono text-[9px] text-slate-300 uppercase tracking-wider">
            Admin
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

      {/* Network Status Indicator */}
      <div className="mx-3 mt-3 flex shrink-0 items-center justify-between rounded-xl border border-slate-800/90 bg-slate-900/60 px-3 py-2 text-xs">
        <div className="flex min-w-0 items-center gap-2 truncate">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <div className="min-w-0 truncate text-left">
            <div className="truncate font-semibold text-slate-100 text-xs">Orders v2 Network</div>
          </div>
        </div>
        <span className="shrink-0 font-mono text-[9px] text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 rounded">
          Live Sandbox
        </span>
      </div>

      {/* Navigation Tabs */}
      <ConsoleSidebarNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleNavChange}
        groups={ADMIN_NAV_GROUPS}
        theme="dark"
      />

      {/* Cross-Portal Switcher Links */}
      <div className="space-y-1 border-slate-800/80 border-t px-3 py-3">
        <span className="block px-2 pb-0.5 font-bold text-[10px] text-slate-500 uppercase tracking-wider">
          Portals
        </span>
        <Link
          href={ROUTES.merchant}
          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 font-medium text-slate-400 text-xs transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <span>Merchant Console</span>
          <span className="font-mono text-[10px] text-slate-500">/merchant</span>
        </Link>
        <Link
          href={ROUTES.client}
          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 font-medium text-slate-400 text-xs transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <span>Client Booking</span>
          <span className="font-mono text-[10px] text-slate-500">/client</span>
        </Link>
      </div>

      {/* User Footer & Reset Demo */}
      <div className="mt-auto shrink-0 space-y-2 border-slate-800/80 border-t bg-slate-900/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 font-bold text-white text-xs">
              {initials}
            </div>
            <div className="min-w-0 text-left">
              <div className="truncate font-semibold text-slate-200 text-xs">{displayName}</div>
              <div className="truncate text-[10px] text-slate-500">{currentUser.role}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLockSession}
            className="shrink-0 rounded-lg border border-slate-800 bg-slate-800/80 p-1 text-slate-400 shadow-xs transition-colors hover:bg-slate-700 hover:text-white"
            title="Lock session"
            aria-label="Lock session"
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
