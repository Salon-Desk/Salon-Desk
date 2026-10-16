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

/** Grouped sidebar tab list with modern 2026 high-density styling. */
export function ConsoleSidebarNav<T extends string>({
  tabs,
  activeTab,
  onChange,
  groups,
  theme = 'dark',
}: ConsoleSidebarNavProps<T>) {
  const isDark = theme === 'dark'

  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
      {groups.map((group) => {
        const items = tabs.filter((tab) => tab.group === group)
        if (items.length === 0) return null
        return (
          <div key={group}>
            <p
              className={cn(
                'mb-1.5 px-2.5 font-bold text-[10px] uppercase tracking-wider',
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
                  'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 font-medium text-xs transition-all duration-150',
                  isDark
                    ? isActive
                      ? 'bg-white/[0.12] text-white font-semibold shadow-xs border border-white/[0.08]'
                      : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
                    : isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
                const itemContent = (
                  <>
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
                          'rounded-md px-1.5 py-0.5 font-mono font-semibold text-[10px] shrink-0',
                          isDark
                            ? tab.isAlert
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
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
