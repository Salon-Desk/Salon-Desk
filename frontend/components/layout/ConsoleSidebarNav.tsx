import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export interface SidebarTab<T extends string> {
  id: T
  label: string
  icon: LucideIcon
  group: string
  badge?: number
  isAlert?: boolean
  href?: string
}

interface ConsoleSidebarNavProps<T extends string> {
  tabs: readonly SidebarTab<T>[]
  activeTab: T
  onChange?: (tab: T) => void
  groups: readonly string[]
  theme?: 'dark' | 'light'
}

/** Grouped sidebar tab list for admin/merchant consoles. */
export function ConsoleSidebarNav<T extends string>({
  tabs,
  activeTab,
  onChange,
  groups,
  theme = 'dark',
}: ConsoleSidebarNavProps<T>) {
  const isDark = theme === 'dark'

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
      {groups.map((group) => {
        const items = tabs.filter((tab) => tab.group === group)
        if (items.length === 0) return null
        return (
          <div key={group}>
            <p
              className={cn(
                'mb-3 px-2 text-[10px] font-bold uppercase tracking-widest',
                isDark ? 'text-slate-500' : 'text-slate-400',
              )}
            >
              {group}
            </p>
            <div className="space-y-1">
              {items.map((tab) => {
                const Icon = tab.icon
                const isActive = tab.id === activeTab
                const itemClasses = cn(
                  'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-xs transition-all duration-200 cursor-pointer',
                  isDark
                    ? isActive
                      ? 'bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-white/[0.04] text-white font-semibold border border-amber-500/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_4px_16px_rgba(245,158,11,0.12)]'
                      : 'text-slate-400 hover:bg-white/[0.08] hover:text-slate-100 border border-transparent hover:border-white/[0.06] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
                    : isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
                const itemContent = (
                  <>
                    {isDark && isActive && (
                      <span
                        className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                        aria-hidden="true"
                      />
                    )}
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isDark
                          ? isActive
                            ? 'text-amber-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                          : isActive
                            ? 'text-amber-400'
                            : 'text-slate-400 group-hover:text-slate-600',
                      )}
                    />
                    <span className="flex-1 text-left truncate">{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={cn(
                          'rounded-lg px-2 py-0.5 font-mono font-semibold text-[10px] shrink-0',
                          isDark
                            ? tab.isAlert
                              ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                              : 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                            : tab.isAlert
                              ? 'bg-rose-500 text-white'
                              : 'bg-amber-100 text-amber-900 border border-amber-300',
                        )}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </>
                )

                if (tab.href) {
                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      onClick={() => onChange?.(tab.id)}
                      className={itemClasses}
                    >
                      {itemContent}
                    </Link>
                  )
                }

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange?.(tab.id)}
                    className={itemClasses}
                  >
                    {itemContent}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </nav>
  )
}
