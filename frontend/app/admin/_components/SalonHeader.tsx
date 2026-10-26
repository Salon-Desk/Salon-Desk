'use client'

import { PageHeader } from '@/components/ui'

export interface SalonHeaderProps {
  totalSalons: number
  isFetching: boolean
  onRefresh: () => void
}

export function SalonHeader({ totalSalons, isFetching, onRefresh }: SalonHeaderProps) {
  return (
    <PageHeader
      variant="plain"
      title="Partner Salons Directory"
      badge={`${totalSalons} Salons`}
      description="Verify, approve, and audit multi-tenant salon organizations, take-rate rules, and merchant credentials."
      onRefresh={onRefresh}
      isRefreshing={isFetching}
      refreshLabel="Refresh"
      refreshTitle="Refresh salons"
    />
  )
}
