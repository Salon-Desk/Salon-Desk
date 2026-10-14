"use client";

import { ArrowRight, CheckCircle2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Badge, buttonClasses } from "@/components/ui";
import type { Tone } from "@/lib/status";

export interface AppCardProps {
  title: string;
  subtitle: string;
  audience: string;
  badge: string;
  badgeTone?: Tone;
  icons: LucideIcon[];
  features: string[];
  route: string;
  actionLabel: string;
  metaHighlight: string;
}

const ACTION_CLASSES: Partial<Record<Tone, string>> = {
  amber:
    "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700",
  sky: "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-500/20 hover:from-sky-700 hover:to-blue-700",
  emerald:
    "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700",
};

export function AppCard({
  title,
  subtitle,
  audience,
  badge,
  badgeTone = "amber",
  icons,
  features,
  route,
  actionLabel,
  metaHighlight,
}: AppCardProps) {
  const [MainIcon, SubIcon1, SubIcon2] = icons;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/80 hover:shadow-xl">
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-800 transition-all group-hover:border-amber-300 group-hover:bg-amber-50/50">
            {MainIcon && <MainIcon className="h-5 w-5 text-amber-600" />}
            {SubIcon1 && <SubIcon1 className="h-4 w-4 text-slate-400" />}
            {SubIcon2 && <SubIcon2 className="h-4 w-4 text-slate-400" />}
          </div>
          <Badge tone={badgeTone}>{badge}</Badge>
        </div>

        <div className="mb-4 space-y-1">
          <span className="font-semibold text-[11px] text-slate-500 uppercase tracking-wide">
            {audience}
          </span>
          <h3 className="font-bold text-slate-900 text-xl transition-colors group-hover:text-amber-700">
            {title}
          </h3>
          <p className="text-slate-600 text-xs leading-relaxed">{subtitle}</p>
        </div>

        <div className="mb-6 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-700">
          <span className="text-slate-500">Context:</span>
          <span className="font-mono font-semibold text-slate-900">
            {metaHighlight}
          </span>
        </div>

        <div className="mb-8 space-y-2.5">
          <span className="block font-bold text-[11px] text-slate-500 uppercase tracking-wider">
            Core Capabilities
          </span>
          <ul className="space-y-2 text-slate-700 text-xs">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span className="leading-snug">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Link
        href={route}
        className={buttonClasses({
          size: "lg",
          fullWidth: true,
          className: ACTION_CLASSES[badgeTone],
        })}
      >
        <span>{actionLabel}</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
