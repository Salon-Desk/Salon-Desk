'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ConsoleShellProps {
  sidebar: ReactNode
  header: ReactNode
  children: ReactNode
  isMobileSidebarOpen: boolean
  onCloseMobileSidebar: () => void
}

/**
 * Shared chrome for the merchant and admin consoles:
 * An executive dark obsidian sidebar with crisp active states,
 * a glassmorphic sticky header, and an elevated ambient main canvas.
 */
export function ConsoleShell({
  sidebar,
  header,
  children,
  isMobileSidebarOpen,
  onCloseMobileSidebar,
}: ConsoleShellProps) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 antialiased selection:bg-amber-500/20 selection:text-amber-900">
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobileSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.08] bg-gradient-to-b from-[#0D131F] via-[#080B13] to-[#04060A] text-slate-100 shadow-[4px_0_36px_-4px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out lg:static lg:translate-x-0',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
