import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, IconChip } from "./card";
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

/** KPI tile used across the merchant and admin dashboards. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "amber",
  footnote,
  emphasizeValue = false,
  footnoteTone,
}: StatCardProps) {
  return (
    <Card hoverTone={tone}>
      <div className="mb-2 flex items-center justify-between text-slate-500">
        <span className="font-bold text-[11px] uppercase tracking-wider">
          {label}
        </span>
        <IconChip tone={tone}>
          <Icon className="h-4 w-4" />
        </IconChip>
      </div>

      <div
        className={cn(
          "font-black text-2xl tabular-nums",
          emphasizeValue ? TONE_TEXT[tone] : "text-slate-900",
        )}
      >
        {value}
      </div>

      {footnote && (
        <div
          className={cn(
            "mt-1 font-semibold text-[11px]",
            TONE_TEXT[footnoteTone ?? tone],
          )}
        >
          {footnote}
        </div>
      )}
    </Card>
  );
}
