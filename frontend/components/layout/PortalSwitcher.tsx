'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useSelector } from 'react-redux'

import { isAdminUser, isClientUser, isMerchantUser, userSelector } from '@/store/authSlice'

import { PORTAL_NAV, type PortalId } from './portal-nav'

interface PortalSwitcherProps {
  current: PortalId
}

function canAccessPortal(portal: PortalId, user: ReturnType<typeof userSelector>): boolean {
  if (!user) return portal === 'client'
  if (portal === 'admin') return isAdminUser(user)
  if (portal === 'merchant') return isMerchantUser(user)
  return isClientUser(user) || isMerchantUser(user) || isAdminUser(user)
}

/** Hover dropdown used in portal headers to jump between the three apps. */
export function PortalSwitcher({ current }: PortalSwitcherProps) {
  const user = useSelector(userSelector)
  const others = PORTAL_NAV.filter((item) => item.id !== current && canAccessPortal(item.id, user))

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 text-xs transition-colors hover:border-slate-300"
      >
        <span className="hidden sm:inline">Switch Portal</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
      </button>
      <div className="pointer-events-none absolute right-0 z-50 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1 opacity-0 shadow-xl transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
        <div className="px-3 py-1.5 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
          Ecosystem Navigation
        </div>
        {others.length === 0 ? (
          <p className="px-3 py-2 text-[11px] text-slate-500">No other portals for this role.</p>
        ) : (
          others.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 font-medium text-slate-700 text-xs hover:bg-slate-50 hover:text-amber-600"
              >
                <Icon className="h-3.5 w-3.5 text-amber-500" />
                <span>{item.label}</span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
