'use client'

import { Menu, Sparkles } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { UserMenu } from '@/components/auth/user-menu'
import { Button } from '@/components/ui'

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
  onOpenCopilot: () => void
}

export function MerchantHeader({
  activeTab: explicitTab,
  onOpenMobileSidebar,
  onOpenCopilot,
}: MerchantHeaderProps) {
  const pathname = usePathname()
  const currentTab = explicitTab || getMerchantTabFromPathname(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md border border-amber-200/80 bg-amber-50/70 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
            Salon Portal
          </span>
          <span className="text-slate-300">/</span>
          <h1 className="font-bold text-slate-900 text-sm tracking-tight">
            {MERCHANT_TAB_TITLES[currentTab]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCopilot}
          className="rounded-lg border-amber-300/80 bg-amber-50/40 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:bg-amber-100/60 hover:border-amber-400"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
          <span>AI Copilot</span>
        </Button>

        <UserMenu portal="merchant" />
      </div>
    </header>
  )
}
