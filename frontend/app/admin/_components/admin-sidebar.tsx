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
            Admin
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

      <div className="relative mx-4 mt-4 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-amber-500/[0.06] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white tracking-wide">Platform live</p>
            <p className="truncate text-[11px] font-medium text-slate-400 mt-0.5">
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

      <div className="relative space-y-1.5 border-t border-white/[0.06] bg-gradient-to-b from-transparent via-black/10 to-black/20 px-4 py-4">
        <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Switch portal
        </p>
        <Link
          href={ROUTES.merchant}
          className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white hover:translate-x-1 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] cursor-pointer"
        >
          <span className="flex items-center gap-2">Merchant</span>
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

      <div className="relative mt-auto shrink-0 border-t border-white/[0.08] bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-3 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_6px_24px_rgba(0,0,0,0.35)]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 to-amber-600/30 text-xs font-bold text-amber-100 ring-1 ring-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-100">{displayName}</div>
              <div className="truncate text-[11px] font-medium text-slate-400 mt-0.5">
                {currentUser.role}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLockSession}
            className="shrink-0 rounded-xl p-2 text-slate-400 transition-all hover:bg-white/10 hover:text-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)] active:scale-95 cursor-pointer"
            title="Lock session"
            aria-label="Lock session"
          >
            <Lock className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
