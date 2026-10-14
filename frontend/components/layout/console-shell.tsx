"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConsoleShellProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  isMobileSidebarOpen: boolean;
  onCloseMobileSidebar: () => void;
}

/**
 * Shared chrome for the merchant and admin consoles: a desktop sidebar that
 * becomes a drawer on mobile, a sticky header, and a scrollable main pane.
 */
export function ConsoleShell({
  sidebar,
  header,
  children,
  isMobileSidebarOpen,
  onCloseMobileSidebar,
}: ConsoleShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobileSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-slate-200 border-r bg-white transition-transform lg:static lg:translate-x-0",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
