'use client'

import { Building2, Layers, Lock, Percent, PieChart, Sliders, Users, X } from 'lucide-react'
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
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#0D1322] via-[#080B14] to-[#04060A] text-slate-200">
      {/* Ambient atmospheric top lighting */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-gradient-to-b from-amber-500/15 to-transparent blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-white/[0.015] px-4 py-4 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" showTagline={false} linkToHome theme="dark" />
          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            Admin
          </span>
        </div>
        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="relative mx-3 mt-3 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-amber-500/[0.04] p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white tracking-wide">Platform live</p>
            <p className="truncate text-[10px] font-medium text-slate-400">
              {organizationCount} salons · {pendingSalonCount} pending
            </p>
          </div>
        </div>
      </div>

      <ConsoleSidebarNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleNavChange}
        groups={ADMIN_NAV_GROUPS}
        theme="dark"
      />

      <div className="relative space-y-1 border-t border-white/[0.06] bg-black/15 px-3 py-3">
        <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Switch portal
        </p>
        <Link
          href={ROUTES.merchant}
          className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white hover:translate-x-0.5"
        >
          <span>Merchant</span>
          <span className="text-[10px] text-slate-500">→</span>
        </Link>
        <Link
          href={ROUTES.client}
          className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white hover:translate-x-0.5"
        >
          <span>Client</span>
          <span className="text-[10px] text-slate-500">→</span>
        </Link>
      </div>

      <div className="relative mt-auto shrink-0 border-t border-white/[0.08] bg-gradient-to-t from-black/60 via-black/30 to-transparent p-3">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2.5 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.3)]">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/25 to-amber-600/25 text-xs font-bold text-amber-200 ring-1 ring-amber-400/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-100">{displayName}</div>
              <div className="truncate text-[10px] font-medium text-slate-400">
                {currentUser.role}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLockSession}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white/10 hover:text-white active:scale-95 cursor-pointer"
            title="Lock session"
            aria-label="Lock session"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
