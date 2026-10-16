import { type LucideIcon, TrendingDown, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type Tone, TONE_TEXT } from './tone'

export interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: Tone
  /** Supporting line under the figure, e.g. "9 upcoming appointments protected". */
  footnote?: string
  /** Tints the figure itself; otherwise it stays slate-900. */
  emphasizeValue?: boolean
  footnoteTone?: Tone
  /** Trend indicator, e.g. { value: "+14.2%", isPositive: true, label: "vs last week" } */
  trend?: {
    value: string
    isPositive?: boolean
    label?: string
  }
  /** Array of normalized points (0-100) or numbers for an ultra-clean micro sparkline */
  sparkline?: number[]
  /** Quick filter click trigger */
  onClick?: () => void
  className?: string
}

const TONE_BG: Record<Tone, string> = {
  amber: 'bg-amber-500/10 text-amber-700 border-amber-300/40',
  emerald: 'bg-emerald-500/10 text-emerald-700 border-emerald-300/40',
  rose: 'bg-rose-500/10 text-rose-700 border-rose-300/40',
  sky: 'bg-sky-500/10 text-sky-700 border-sky-300/40',
  slate: 'bg-slate-500/10 text-slate-700 border-slate-300/40',
  purple: 'bg-purple-500/10 text-purple-700 border-purple-300/40',
  blue: 'bg-blue-500/10 text-blue-700 border-blue-300/40',
}

const TONE_DOT: Record<Tone, string> = {
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  slate: 'bg-slate-400',
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
}

const TONE_SPARKLINE_COLOR: Record<Tone, { stroke: string; fill: string }> = {
  amber: { stroke: '#d97706', fill: 'rgba(245, 158, 11, 0.12)' },
  emerald: { stroke: '#059669', fill: 'rgba(16, 185, 129, 0.12)' },
  rose: { stroke: '#e11d48', fill: 'rgba(244, 63, 94, 0.12)' },
  sky: { stroke: '#0284c7', fill: 'rgba(14, 165, 233, 0.12)' },
  slate: { stroke: '#64748b', fill: 'rgba(100, 116, 139, 0.12)' },
  purple: { stroke: '#9333ea', fill: 'rgba(168, 85, 247, 0.12)' },
  blue: { stroke: '#2563eb', fill: 'rgba(59, 130, 246, 0.12)' },
}

function MiniSparkline({ data, tone }: { data: number[]; tone: Tone }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 84
  const height = 28
  const padding = 2

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((d - min) / range) * (height - 2 * padding)
    return { x, y }
  })

  const pathD = points.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`,
    '',
  )
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${height} L ${points[0].x.toFixed(1)},${height} Z`
  const colors = TONE_SPARKLINE_COLOR[tone] ?? TONE_SPARKLINE_COLOR.amber

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-${tone})`} />
      <path
        d={pathD}
        fill="none"
        stroke={colors.stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Hyper-modern 2026 KPI card used across merchant and admin dashboards. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'amber',
  footnote,
  emphasizeValue = false,
  footnoteTone,
  trend,
  sparkline,
  onClick,
  className,
}: StatCardProps) {
  const effectiveFootnoteTone = footnoteTone ?? tone
  const isClickable = Boolean(onClick)

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={cn(
        'group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4.5 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_0_0_rgba(255,255,255,0.85)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_6px_16px_-4px_rgba(0,0,0,0.06),0_2px_4px_-1px_rgba(0,0,0,0.03)]',
        isClickable && 'cursor-pointer select-none active:scale-[0.99]',
        className,
      )}
    >
      {/* Subtle ambient corner glow */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 h-24 w-24 rounded-full bg-slate-100 opacity-60 blur-2xl group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between text-slate-500">
        <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-105 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]',
            TONE_BG[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
        <div>
          <div
            className={cn(
              'font-mono font-extrabold text-2xl sm:text-3xl tracking-tight tabular-nums',
              emphasizeValue ? TONE_TEXT[tone] : 'text-slate-900',
            )}
          >
            {value}
          </div>

          {trend ? (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold text-[11px]',
                  trend.isPositive !== false
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                    : 'bg-rose-50 text-rose-800 border border-rose-200/60',
                )}
              >
                {trend.isPositive !== false ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.value}
              </span>
              {trend.label && (
                <span className="text-[11px] text-slate-400 font-medium">{trend.label}</span>
              )}
            </div>
          ) : footnote ? (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span
                className={cn('h-1.5 w-1.5 rounded-full shrink-0', TONE_DOT[effectiveFootnoteTone])}
              />
              <span className={cn(TONE_TEXT[effectiveFootnoteTone])}>{footnote}</span>
            </div>
          ) : null}
        </div>

        {sparkline && sparkline.length >= 2 ? (
          <div className="shrink-0 mb-0.5">
            <MiniSparkline data={sparkline} tone={tone} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
