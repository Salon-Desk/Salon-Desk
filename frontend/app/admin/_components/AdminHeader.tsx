'use client'

import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { UserMenu } from '@/components/auth/user-menu'

import { ADMIN_TAB_TITLES, getAdminTabFromPathname } from '../_constants/admin-nav'
import type { AdminTabId } from '../_types/admin-types'

interface AdminHeaderProps {
  activeTab?: AdminTabId
  onOpenMobileSidebar: () => void
}

export function AdminHeader({ activeTab: explicitTab, onOpenMobileSidebar }: AdminHeaderProps) {
  const pathname = usePathname()
  const currentTab = explicitTab || getAdminTabFromPathname(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/85 px-3 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:hidden cursor-pointer shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="hidden sm:inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 shrink-0">
            Platform Admin
          </span>
          <span className="hidden sm:inline text-slate-300">/</span>
          <h1 className="font-bold text-slate-900 text-sm tracking-tight truncate">
            {ADMIN_TAB_TITLES[currentTab]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <UserMenu portal="admin" />
      </div>
    </header>
  )
}
