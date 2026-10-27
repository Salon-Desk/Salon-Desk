'use client'

import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { SandboxCredentialsIconButton } from '@/app/_components/SandboxCredentialsIconButton'
import { UserMenu } from '@/components/auth/user-menu'

import {
  getMerchantTabFromPathname,
  MERCHANT_TAB_TITLES,
  type MerchantTab,
} from '../_types/merchant-types'

interface MerchantHeaderProps {
  activeTab?: MerchantTab
  lastReconciledAt?: string
  simulatedDrift?: boolean
  onOpenMobileSidebar: () => void
  onToggleDrift?: () => void
}

export function MerchantHeader({
  activeTab: explicitTab,
  onOpenMobileSidebar,
}: MerchantHeaderProps) {
  const pathname = usePathname()
  const currentTab = explicitTab || getMerchantTabFromPathname(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="hidden sm:inline-flex items-center rounded-md border border-amber-200/80 bg-amber-50/70 px-2 py-0.5 text-[11px] font-semibold text-amber-900 shrink-0">
            Salon Portal
          </span>
          <span className="hidden sm:inline text-slate-300">/</span>
          <h1 className="font-bold text-slate-900 text-sm tracking-tight truncate">
            {MERCHANT_TAB_TITLES[currentTab]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <SandboxCredentialsIconButton />
        <UserMenu portal="merchant" />
      </div>
    </header>
  )
}
