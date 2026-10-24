'use client'

import { Building2, Clock, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { ElementType } from 'react'

import type { SalonCounts, StatusFilter } from '@/types/organization'

interface KpiConfig {
  key: StatusFilter
  label: string
  subtitle: string
  countKey: keyof SalonCounts
  icon: ElementType
  activeBorder: string
  activeBg: string
  activeRing: string
  valueColor: string
  badgeBg: string
  badgeText: string
  badgeActiveBg: string
  hasBeacon?: boolean
}

const KPI_CARDS: KpiConfig[] = [
  {
    key: 'all',
    label: 'Total Salons',
    subtitle: 'All registered tenants',
    countKey: 'all',
    icon: Building2,
    activeBorder: 'border-slate-900',
    activeBg: 'bg-slate-900 text-white',
    activeRing: 'ring-2 ring-slate-900/10',
    valueColor: 'text-slate-900',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeActiveBg: 'bg-white/10 text-white',
  },
  {
    key: 'approved',
    label: 'Active & Approved',
    subtitle: 'Verified booking & holds',
    countKey: 'approved',
    icon: ShieldCheck,
    activeBorder: 'border-emerald-600',
    activeBg: 'bg-emerald-950 text-white',
    activeRing: 'ring-2 ring-emerald-500/20',
    valueColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 border border-emerald-100',
    badgeText: 'text-emerald-600',
    badgeActiveBg: 'bg-emerald-800/40 text-emerald-300',
  },
  {
    key: 'pending',
    label: 'Needs Review',
    subtitle: 'Awaiting compliance check',
    countKey: 'pending',
    icon: Clock,
    activeBorder: 'border-amber-500',
    activeBg: 'bg-amber-950 text-white',
    activeRing: 'ring-2 ring-amber-500/20',
    valueColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 border border-amber-100',
    badgeText: 'text-amber-600',
    badgeActiveBg: 'bg-amber-800/40 text-amber-300',
    hasBeacon: true,
  },
  {
    key: 'suspended',
    label: 'Suspended',
    subtitle: 'Temporarily paused',
    countKey: 'suspended',
    icon: ShieldAlert,
    activeBorder: 'border-rose-600',
    activeBg: 'bg-rose-950 text-white',
    activeRing: 'ring-2 ring-rose-500/20',
    valueColor: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-50 border border-rose-100',
    badgeText: 'text-rose-600',
    badgeActiveBg: 'bg-rose-800/40 text-rose-300',
  },
]

interface SalonKpiGridProps {
  counts: SalonCounts
  activeFilter: StatusFilter
  onSelectFilter: (filter: StatusFilter) => void
}

export function SalonKpiGrid({ counts, activeFilter, onSelectFilter }: SalonKpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {KPI_CARDS.map((card) => {
        const isActive = activeFilter === card.key
        const Icon = card.icon
        const count = counts[card.countKey]

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelectFilter(card.key)}
            className={`flex items-start justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 hover:shadow-md ${
              isActive
                ? `${card.activeBorder} ${card.activeBg} ${card.activeRing}`
                : 'border-slate-200/80 bg-white text-slate-900 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-medium ${isActive ? 'text-white/80' : 'text-slate-500'}`}
                >
                  {card.label}
                </span>
                {card.hasBeacon && count > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                )}
              </div>
              <div
                className={`mt-1 text-2xl font-extrabold tracking-tight ${
                  isActive ? 'text-white' : card.valueColor
                }`}
              >
                {count}
              </div>
              <p className={`mt-1 text-[11px] ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                {card.subtitle}
              </p>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isActive ? card.badgeActiveBg : `${card.badgeBg} ${card.badgeText}`
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
          </button>
        )
      })}
    </div>
  )
}
