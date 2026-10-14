'use client'

import { ChevronDown, RotateCcw } from 'lucide-react'
import Link from 'next/link'

import { PORTAL_NAV, type PortalId } from './portal-nav'

interface PortalSwitcherProps {
  current: PortalId
  onReset?: () => void
  isResetting?: boolean
}

/** Hover dropdown used in portal headers to jump between the three apps. */
export function PortalSwitcher({ current, onReset, isResetting }: PortalSwitcherProps) {
  const others = PORTAL_NAV.filter((item) => item.id !== current)

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
        {others.map((item) => {
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
        })}
        {onReset && (
          <>
            <div className="my-1 h-px bg-slate-100" />
            <button
              type="button"
              onClick={onReset}
              disabled={isResetting}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-rose-600 text-xs hover:bg-rose-50"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Demo State</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
