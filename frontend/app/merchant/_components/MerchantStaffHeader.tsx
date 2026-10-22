'use client'

import { Clock, Plus, RefreshCw, Sparkles } from 'lucide-react'
import type React from 'react'

import { IconButton } from '@/components/ui'
import PrimaryButton from '@/components/ui/primary-button'
import { cn } from '@/lib/utils'

export interface MerchantStaffHeaderProps {
  /** Total count of staff members to display in the counter badge */
  totalMembers?: number
  /** Header title, defaults to 'Stylists & Staff Directory' */
  title?: string
  /** Subtitle description */
  description?: string
  /** Eyebrow badge label, defaults to 'Salon Team Management' */
  badgeLabel?: string
  /** Indicates whether the staff list is currently re-fetching */
  isFetching?: boolean
  /** Callback triggered when clicking the refresh button */
  onRefresh?: () => void
  /** Callback triggered when clicking the shifts & schedules button */
  onOpenShifts?: () => void
  /** Callback triggered when clicking the add staff button */
  onAddStaff?: () => void
  /** Optional custom action nodes to append */
  actions?: React.ReactNode
  /** Custom wrapper className */
  className?: string
}

export function MerchantStaffHeader({
  totalMembers = 0,
  title = 'Stylists & Staff Directory',
  description = 'Manage salon personnel, booking roles, availability, and scheduled work shifts.',
  badgeLabel = 'Salon Team Management',
  isFetching = false,
  onRefresh,
  onOpenShifts,
  onAddStaff,
  actions,
  className,
}: MerchantStaffHeaderProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-amber-50/25 to-amber-100/20 p-6 shadow-xs backdrop-blur-md sm:p-8',
        className,
      )}
    >
      {/* Ambient background glow accents */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-amber-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-amber-200/20 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
        {/* Left: Eyebrow badge, Title, Counter pill, and Subtitle */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-900 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>{badgeLabel}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-extrabold text-slate-900 text-2xl tracking-tight sm:text-3xl">
              {title}
            </h1>
            <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-2xs">
              {totalMembers} {totalMembers === 1 ? 'Member' : 'Members'}
            </span>
          </div>

          {description && (
            <p className="text-xs text-slate-500 sm:text-sm font-normal leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Right: Action buttons toolbar */}
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-xs backdrop-blur-sm">
          {onRefresh && (
            <IconButton
              aria-label="Refresh roster"
              onClick={onRefresh}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.92]"
              title="Refresh staff"
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin text-amber-600')} />
            </IconButton>
          )}

          {onOpenShifts && (
            <button
              type="button"
              onClick={onOpenShifts}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-300/80 bg-amber-50/70 px-3.5 text-xs font-bold text-amber-900 shadow-2xs transition-all hover:bg-amber-100/90 hover:text-amber-950 active:scale-[0.98] cursor-pointer"
              title="Manage staff shifts and schedules"
            >
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="hidden sm:inline">Shifts &amp; Schedules</span>
            </button>
          )}

          {onAddStaff && (
            <div data-agent-action="add-staff">
              <PrimaryButton
                title="Add team member"
                size="sm"
                fullWidth={false}
                icon={<Plus className="h-4 w-4" />}
                className="h-10 rounded-xl px-5 text-xs font-bold shadow-xs transition-all hover:shadow-md active:scale-[0.98]"
                onClick={onAddStaff}
              />
            </div>
          )}

          {actions}
        </div>
      </div>
    </div>
  )
}
