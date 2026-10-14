"use client";

import { CheckCircle2, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const POSITION_CLASSES = {
  "bottom-right": "bottom-6 right-6 animate-in slide-in-from-bottom-4",
  "bottom-center":
    "bottom-20 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom-2",
  "top-right": "top-5 right-5 animate-in slide-in-from-top-2",
} as const;

export interface ToastProps {
  message: ReactNode;
  onDismiss?: () => void;
  position?: keyof typeof POSITION_CLASSES;
  /** `dark` reads better over dense dashboards; `light` over marketing pages. */
  theme?: "light" | "dark";
  icon?: ReactNode;
}

export function Toast({
  message,
  onDismiss,
  position = "bottom-right",
  theme = "light",
  icon,
}: ToastProps) {
  return (
    <output
      aria-live="polite"
      className={cn(
        "fixed z-50 flex max-w-md items-start gap-3 rounded-2xl border p-4 shadow-2xl duration-300",
        POSITION_CLASSES[position],
        theme === "dark"
          ? "border-slate-700 bg-slate-900 text-white backdrop-blur-md"
          : "border-amber-300 bg-white text-slate-800",
      )}
    >
      <span className="shrink-0">
        {icon ?? (
          <CheckCircle2
            className={cn(
              "h-5 w-5",
              theme === "dark" ? "text-emerald-400" : "text-amber-600",
            )}
          />
        )}
      </span>

      <div className="flex-1 font-medium text-xs leading-relaxed">
        {message}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className={cn(
            "shrink-0 p-0.5 transition-colors",
            theme === "dark"
              ? "text-slate-400 hover:text-white"
              : "text-slate-400 hover:text-slate-600",
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </output>
  );
}
