'use client'

import { Clock, Plus, RefreshCw } from 'lucide-react'
import type React from 'react'

import { PrimaryButton } from '@/components/button'
import { IconButton, PageHeader } from '@/components/ui'
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
    <PageHeader
      className={className}
      eyebrow={badgeLabel}
      title={title}
      badge={`${totalMembers} ${totalMembers === 1 ? 'Member' : 'Members'}`}
      description={description}
      actions={
        <>
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
        </>
      }
    />
  )
}
