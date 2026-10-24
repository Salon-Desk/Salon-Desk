'use client'

import { Clock, DollarSign, TrendingUp, Users } from 'lucide-react'

import { StatCard } from '@/components/card'
import { formatUsd } from '@/lib/format'
import type { HoldState } from '@/types'

interface KpiData {
  totalBookings: number
  totalHoldValue: number
  pendingHolds: number
  capturedBookings: number
  noShowCaptured: number
  voidedBookings: number
}

interface AppointmentsKpiCardsProps {
  kpiData: KpiData
  onFilterChange?: (filter: 'ALL' | HoldState) => void
  activeFilter?: 'ALL' | HoldState
}

export function AppointmentsKpiCards({
  kpiData,
  onFilterChange,
  activeFilter = 'ALL',
}: AppointmentsKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        label="Total Bookings"
        value={kpiData.totalBookings}
        icon={Users}
        tone="slate"
        footnote={`${kpiData.voidedBookings} voided reservations`}
        onClick={onFilterChange ? () => onFilterChange('ALL') : undefined}
        className={activeFilter === 'ALL' ? 'ring-2 ring-slate-900/10' : undefined}
      />
      <StatCard
        label="Active Escrow Hold"
        value={formatUsd(kpiData.totalHoldValue)}
        icon={DollarSign}
        tone="amber"
        footnote="Zero upfront customer debit"
        onClick={onFilterChange ? () => onFilterChange('HELD') : undefined}
        className={activeFilter === 'HELD' ? 'ring-2 ring-amber-500/20' : undefined}
      />
      <StatCard
        label="Awaiting Settlement"
        value={kpiData.pendingHolds}
        icon={Clock}
        tone="blue"
        footnote="Requires show / no-show HITL"
        onClick={onFilterChange ? () => onFilterChange('HELD') : undefined}
      />
      <StatCard
        label="Captured Revenue"
        value={kpiData.capturedBookings}
        icon={TrendingUp}
        tone="emerald"
        footnote={`${kpiData.noShowCaptured} no-show penalties`}
        onClick={onFilterChange ? () => onFilterChange('CAPTURED') : undefined}
        className={activeFilter === 'CAPTURED' ? 'ring-2 ring-emerald-500/20' : undefined}
      />
    </div>
  )
}
