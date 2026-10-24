'use client'

import { Calendar } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { PageHeader } from '@/components/ui'

export interface AppointmentsPageHeaderProps {
  bookingsCount: number
  isLoading: boolean
  onRefresh?: () => void
}

export function AppointmentsPageHeader({
  bookingsCount,
  isLoading,
  onRefresh,
}: AppointmentsPageHeaderProps) {
  return (
    <PageHeader
      variant="card"
      accent="amber"
      eyebrow="Operations desk"
      title="Appointments & Settlements"
      titleClassName="text-2xl sm:text-3xl"
      description={
        isLoading
          ? 'Loading reservations…'
          : `${bookingsCount} reservations protected via $0 PayPal escrow hold rails`
      }
      onRefresh={onRefresh}
      isRefreshing={isLoading}
      refreshTitle="Refresh appointments"
      actions={
        <Link
          href="/merchant/calendar"
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 text-xs font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50/40"
        >
          <Calendar className="h-3.5 w-3.5 text-amber-600" />
          <span>Calendar View</span>
        </Link>
      }
    />
  )
}
