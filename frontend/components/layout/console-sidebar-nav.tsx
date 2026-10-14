"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarTab<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
  group: string;
  badge?: number;
  isAlert?: boolean;
}

interface ConsoleSidebarNavProps<T extends string> {
  tabs: readonly SidebarTab<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  groups: readonly string[];
}

/** Grouped sidebar tab list used by both merchant and admin consoles. */
export function ConsoleSidebarNav<T extends string>({
  tabs,
  activeTab,
  onChange,
  groups,
}: ConsoleSidebarNavProps<T>) {
  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
      {groups.map((group) => {
        const items = tabs.filter((tab) => tab.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="mb-1.5 px-2 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
              {group}
            </p>
            <div className="space-y-0.5">
              {items.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange(tab.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 font-semibold text-xs transition-colors",
                      isActive
                        ? "bg-amber-50 text-amber-900 shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-amber-600" : "text-slate-400",
                      )}
                    />
                    <span className="flex-1 text-left">{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 font-black text-[10px]",
                          tab.isAlert
                            ? "bg-rose-500 text-white"
                            : "bg-amber-500 text-slate-950",
                        )}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
