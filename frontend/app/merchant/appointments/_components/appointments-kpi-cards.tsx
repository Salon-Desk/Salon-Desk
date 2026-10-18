import { Clock, DollarSign, TrendingUp, Users } from 'lucide-react'

import { StatCard } from '@/components/ui/stat-card'
import { formatUsd } from '@/lib/format'

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
}

export function AppointmentsKpiCards({ kpiData }: AppointmentsKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Bookings"
        value={kpiData.totalBookings}
        icon={Users}
        tone="slate"
        footnote={`${kpiData.voidedBookings} voided`}
      />
      <StatCard
        label="Total Hold Value"
        value={formatUsd(kpiData.totalHoldValue)}
        icon={DollarSign}
        tone="amber"
        footnote="Active escrow"
      />
      <StatCard
        label="Pending Holds"
        value={kpiData.pendingHolds}
        icon={Clock}
        tone="blue"
        footnote="Awaiting settlement"
      />
      <StatCard
        label="Captured Revenue"
        value={kpiData.capturedBookings}
        icon={TrendingUp}
        tone="emerald"
        footnote={`${kpiData.noShowCaptured} no-show fees`}
      />
    </div>
  )
}
