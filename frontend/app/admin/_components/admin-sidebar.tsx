'use client'

import {
  Building2,
  Layers,
  Lock,
  MessageSquareQuote,
  Percent,
  PieChart,
  Receipt,
  Sliders,
  Users,
  X,
} from 'lucide-react'

import { Logo } from '@/components/brand/logo'
import { ConsoleSidebarNav, type SidebarTab } from '@/components/layout/console-sidebar-nav'
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
  pendingReviewCount: number
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
  pendingReviewCount,
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
      id: 'reviews',
      label: ADMIN_TAB_LABELS.reviews,
      icon: MessageSquareQuote,
      group: ADMIN_NAV_GROUPS[1],
      badge: pendingReviewCount,
      isAlert: pendingReviewCount > 0,
      href: ADMIN_TAB_ROUTES.reviews,
    },
    {
      id: 'commission',
      label: ADMIN_TAB_LABELS.commission,
      icon: Percent,
      group: ADMIN_NAV_GROUPS[2],
      href: ADMIN_TAB_ROUTES.commission,
    },
    {
      id: 'billing',
      label: ADMIN_TAB_LABELS.billing,
      icon: Receipt,
      group: ADMIN_NAV_GROUPS[2],
      href: ADMIN_TAB_ROUTES.billing,
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

  const displayName = currentUser.name

  const handleNavChange = (tab: AdminTabId) => {
    onTabChange?.(tab)
    onCloseMobile?.()
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0A0E17] text-slate-200">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" showTagline={false} linkToHome theme="dark" />
          <div className="flex items-center gap-1.5">
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.12)]">
              Admin
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
        groups={ADMIN_NAV_GROUPS}
        theme="dark"
      />

      <div className="mt-auto shrink-0 border-t border-white/[0.08] bg-[#070A11] p-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/25 to-amber-600/25 text-xs font-bold text-amber-200 ring-1 ring-amber-400/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-200">{displayName}</div>
              <div className="truncate text-[10px] font-medium text-slate-400 mt-0.5">
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
