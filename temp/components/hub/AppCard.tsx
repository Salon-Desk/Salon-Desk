'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export interface AppCardProps {
  title: string;
  subtitle: string;
  role: string;
  badge: string;
  badgeVariant?: 'amber' | 'blue' | 'emerald';
  icons: React.ComponentType<{ className?: string }>[];
  features: string[];
  route: string;
  actionLabel: string;
  metaHighlight: string;
}

export function AppCard({
  title,
  subtitle,
  role,
  badge,
  badgeVariant = 'amber',
  icons,
  features,
  route,
  actionLabel,
  metaHighlight,
}: AppCardProps) {
  const badgeClasses = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }[badgeVariant];

  const buttonAccentClasses = {
    amber: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20',
    blue: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-md shadow-sky-500/20',
    emerald: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20',
  }[badgeVariant];

  const MainIcon = icons[0];
  const SubIcon1 = icons[1];
  const SubIcon2 = icons[2];

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-400/80 p-7 transition-all duration-300 hover:-translate-y-1">
      {/* Top Header & Role */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 group-hover:border-amber-300 group-hover:bg-amber-50/50 transition-all">
            {MainIcon && <MainIcon className="w-5 h-5 text-amber-600" />}
            {SubIcon1 && <SubIcon1 className="w-4 h-4 text-slate-400" />}
            {SubIcon2 && <SubIcon2 className="w-4 h-4 text-slate-400" />}
          </div>
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${badgeClasses}`}>
            {badge}
          </span>
        </div>

        <div className="space-y-1 mb-4">
          <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-500">
            {role}
          </span>
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Sandbox Context Strip */}
        <div className="mb-6 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-center justify-between">
          <span className="text-slate-500">Context:</span>
          <span className="font-semibold text-slate-900 font-mono">{metaHighlight}</span>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2.5 mb-8">
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 block">
            Core Capabilities
          </span>
          <ul className="space-y-2 text-xs text-slate-700">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Primary Navigation Button */}
      <Link
        href={route}
        className={`w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-xs tracking-wide transition-all active:scale-[0.98] ${buttonAccentClasses}`}
      >
        <span>{actionLabel}</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
