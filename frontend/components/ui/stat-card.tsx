import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONE_TEXT, type Tone } from "./tone";

export interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: Tone;
  /** Supporting line under the figure, e.g. "9 upcoming appointments protected". */
  footnote?: string;
  /** Tints the figure itself; otherwise it stays slate-900. */
  emphasizeValue?: boolean;
  footnoteTone?: Tone;
}

const TONE_BG: Record<Tone, string> = {
  amber: "bg-amber-500/10 text-amber-700 border-amber-300/40",
  emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-300/40",
  rose: "bg-rose-500/10 text-rose-700 border-rose-300/40",
  sky: "bg-sky-500/10 text-sky-700 border-sky-300/40",
  slate: "bg-slate-500/10 text-slate-700 border-slate-300/40",
  purple: "bg-purple-500/10 text-purple-700 border-purple-300/40",
  blue: "bg-blue-500/10 text-blue-700 border-blue-300/40",
};

const TONE_DOT: Record<Tone, string> = {
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  slate: "bg-slate-400",
  purple: "bg-purple-500",
  blue: "bg-blue-500",
};

/** Modern 2026 KPI tile used across merchant and admin dashboards. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "amber",
  footnote,
  emphasizeValue = false,
  footnoteTone,
}: StatCardProps) {
  const effectiveFootnoteTone = footnoteTone ?? tone;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md">
      {/* Subtle ambient corner glow */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 h-24 w-24 rounded-full bg-slate-100 opacity-60 blur-2xl group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between text-slate-500">
        <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105",
            TONE_BG[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="relative z-10 mt-3">
        <div
          className={cn(
            "font-extrabold text-2xl sm:text-3xl tracking-tight tabular-nums",
            emphasizeValue ? TONE_TEXT[tone] : "text-slate-900",
          )}
        >
          {value}
        </div>

        {footnote && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                TONE_DOT[effectiveFootnoteTone],
              )}
            />
            <span className={cn(TONE_TEXT[effectiveFootnoteTone])}>
              {footnote}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
