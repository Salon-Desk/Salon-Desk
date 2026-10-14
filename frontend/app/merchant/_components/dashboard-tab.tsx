'use client'

import { Clock, CreditCard, DollarSign, ShieldCheck } from 'lucide-react'

import { Button, Card, HoldStateBadge, StatCard } from '@/components/ui'
import type { MerchantSalonInfo } from '@/lib/data/merchant'
import { formatUsd } from '@/lib/format'
import type { Booking } from '@/types'

import type { MerchantTab } from '../_types/merchant-types'

interface DashboardTabProps {
  salon: MerchantSalonInfo
  bookings: Booking[]
  activeHoldsCount: number
  activeHoldsVolume: number
  capturedRevenue: number
  noShowRecovered: number
  onSelectBooking: (booking: Booking) => void
  onNavigateTab: (tab: MerchantTab) => void
}

export function DashboardTab({
  salon,
  bookings,
  activeHoldsCount,
  activeHoldsVolume,
  capturedRevenue,
  noShowRecovered,
  onSelectBooking,
  onNavigateTab,
}: DashboardTabProps) {
  const todayBookings = bookings.filter((b) => b.appointmentTime.includes('Today'))

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Holds"
          value={formatUsd(activeHoldsVolume)}
          icon={ShieldCheck}
          tone="amber"
          footnote={`${activeHoldsCount} upcoming appointments protected`}
        />
        <StatCard
          label="Captured Revenue (MTD)"
          value={formatUsd(capturedRevenue)}
          icon={DollarSign}
          tone="emerald"
          emphasizeValue
          footnote="100% settled via PayPal Orders v2"
        />
        <StatCard
          label="No-Show Recoveries"
          value={formatUsd(noShowRecovered)}
          icon={CreditCard}
          tone="rose"
          footnote="0 card chargebacks · 100% recovered"
          footnoteTone="emerald"
        />
        <StatCard
          label="Avg Cancellation Notice"
          value="28.4 hours"
          icon={Clock}
          tone="sky"
          footnote={`Policy requires ≥ ${salon.cancellationPolicyHours}h notice`}
          footnoteTone="slate"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card padding="lg" className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                Today&apos;s Upcoming Appointments
              </h3>
              <p className="text-slate-600 text-xs">
                Protected by PayPal authorization holds. Settle or mark no-show when client arrives.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigateTab('calendar')}>
              Open Calendar →
            </Button>
          </div>

          <div className="space-y-3">
            {todayBookings.map((b) => (
              <div
                key={b.id}
                className="flex w-full cursor-pointer flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:border-amber-400 hover:bg-amber-50/40 sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{b.clientName}</span>
                    <HoldStateBadge status={b.status} />
                  </div>
                  <div className="text-slate-600 text-xs">
                    {b.serviceName} ·{' '}
                    <span className="font-semibold text-amber-800">{b.appointmentTime}</span> ·
                    Stylist: {b.stylistName}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-slate-900 text-sm">
                      {formatUsd(b.servicePrice)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Hold: {formatUsd(b.holdAmount)}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => onSelectBooking(b)}>
                    Settlement Drawer →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg" className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Salon Account Status
            </h3>

            <div className="space-y-2 text-xs">
              <Card padding="sm" className="space-y-1 bg-slate-50">
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  PayPal Merchant ID
                </span>
                <div className="flex items-center justify-between font-bold font-mono text-amber-800">
                  <span>{salon.paypalMerchantId}</span>
                  <span className="font-bold text-[10px] text-emerald-700">VERIFIED ✓</span>
                </div>
              </Card>

              <Card padding="sm" className="space-y-1 bg-slate-50">
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  Cancellation Policy
                </span>
                <div className="font-medium text-slate-800">
                  ≥ {salon.cancellationPolicyHours} hours free notice
                </div>
                <div className="text-[11px] text-slate-600">
                  No-show fee:{' '}
                  <strong className="text-slate-900">{formatUsd(salon.defaultNoShowFee)}</strong>
                </div>
              </Card>

              <Card padding="sm" className="space-y-1 bg-slate-50">
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  Platform Commission Tier
                </span>
                <div className="font-bold text-emerald-700">{salon.commissionRate}% VIP Rate</div>
                <div className="text-[10px] text-slate-500">
                  Includes PayPal Orders v2 authorization rails
                </div>
              </Card>
            </div>
          </div>

          <Button variant="secondary" fullWidth onClick={() => onNavigateTab('settings')}>
            Manage PayPal &amp; Policies →
          </Button>
        </Card>
      </div>
    </div>
  )
}
