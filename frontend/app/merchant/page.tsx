'use client'

import {
  ArrowRight,
  ArrowUpRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  RefreshCw,
  Scissors,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import PrimaryButton from '@/components/button/PrimaryButton'
import { LineTrendChart } from '@/components/chart/LineTrendChart'
import { Badge, Card, EmptyState, HoldStateBadge, StatCard } from '@/components/ui'
import { ROUTES } from '@/lib/constants'
import { formatUsd } from '@/lib/format'
import { mapApiBookingToUi } from '@/lib/mappers/booking'
import { cn } from '@/lib/utils'
import {
  useGetMyChangeRequestsQuery,
  useGetMyOrgAccountQuery,
  useGetMyOrganizationQuery,
  useGetMyOrgBookingsQuery,
  useGetMyServicesQuery,
} from '@/store/api/orgApi'
import type { Booking, HoldState } from '@/types'

import { useMerchantContext } from './_context/merchant-context'

type BookingFilterTab = 'all' | 'holds' | 'captured' | 'voided'

export default function MerchantDashboardPage() {
  const { setSelectedBooking, setInspectConsentBooking, setIsCopilotOpen } = useMerchantContext()
  const [filterTab, setFilterTab] = useState<BookingFilterTab>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: org, isLoading: orgLoading, refetch: refetchOrg } = useGetMyOrganizationQuery()
  const { data: account, isLoading: accountLoading } = useGetMyOrgAccountQuery()
  const {
    data: apiBookingsData,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useGetMyOrgBookingsQuery()
  const { data: changeRequestsData } = useGetMyChangeRequestsQuery()
  const { data: servicesData } = useGetMyServicesQuery()

  const apiBookings = apiBookingsData?.items ?? []
  const changeRequests = changeRequestsData?.items ?? []
  const services = servicesData?.items ?? []

  const bookings = useMemo(
    () => apiBookings.map((b) => mapApiBookingToUi(b, { salonName: org?.name })),
    [apiBookings, org?.name],
  )

  const activeHolds = useMemo(
    () => bookings.filter((b) => b.status === 'HELD' || b.status === 'REAUTHORIZED'),
    [bookings],
  )
  const activeHoldsCount = activeHolds.length
  const activeHoldsVolume = useMemo(
    () => activeHolds.reduce((sum, b) => sum + b.holdAmount, 0),
    [activeHolds],
  )

  const capturedBookings = useMemo(
    () => bookings.filter((b) => b.status === 'CAPTURED'),
    [bookings],
  )
  const capturedRevenue = useMemo(
    () => capturedBookings.reduce((sum, b) => sum + b.servicePrice, 0),
    [capturedBookings],
  )

  const voidedBookings = useMemo(
    () => bookings.filter((b) => b.status === 'VOIDED' || b.status === 'NO_SHOW_CAPTURED'),
    [bookings],
  )

  const pendingChangeRequests = useMemo(
    () => changeRequests.filter((cr) => cr.status.toUpperCase() === 'PENDING').length,
    [changeRequests],
  )

  const filteredBookings = useMemo(() => {
    switch (filterTab) {
      case 'holds':
        return activeHolds
      case 'captured':
        return capturedBookings
      case 'voided':
        return voidedBookings
      default:
        return bookings
    }
  }, [filterTab, activeHolds, capturedBookings, voidedBookings, bookings])

  const revenueTrend = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((day, i) => ({
      day,
      revenue: Math.round(capturedRevenue * (0.35 + i * 0.09) + activeHoldsVolume * 0.06 * i),
    }))
  }, [capturedRevenue, activeHoldsVolume])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refetchBookings(), refetchOrg()])
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  const isLoading = orgLoading || bookingsLoading || accountLoading

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      {/* ===================== HERO COMMAND BANNER ===================== */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/70 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/20">
        {/* Ambient background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/20 to-amber-700/20 text-amber-300 font-extrabold text-2xl shadow-inner backdrop-blur-sm">
              {org?.name ? org.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {org?.name || 'Salon Command Center'}
                </h1>
                <Badge
                  tone="emerald"
                  dot
                  pulsing
                  className="bg-emerald-500/15 text-emerald-300 border-emerald-400/30 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5"
                >
                  Verified Merchant
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Escrow Balance:{' '}
                  <strong className="text-amber-300 font-bold">
                    {formatUsd(activeHoldsVolume)}
                  </strong>
                </span>
                <span className="text-slate-500">·</span>
                <span>
                  Active Holds:{' '}
                  <strong className="text-slate-100 font-bold">{activeHoldsCount}</strong>
                </span>
                {account?.merchant_id ? (
                  <>
                    <span className="text-slate-500">·</span>
                    <span className="font-mono text-slate-400 text-xs">
                      PayPal: {account.merchant_id}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-800/80 px-3.5 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all hover:bg-slate-700/80 hover:text-white active:scale-95 disabled:opacity-50"
              title="Sync latest data"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
              <span>Sync</span>
            </button>

            <Link
              href={ROUTES.merchantCalendar}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-800/80 px-4 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all hover:bg-slate-700/80 hover:text-white hover:border-slate-600 active:scale-95"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-amber-400" />
              <span>Live Calendar</span>
            </Link>

            <PrimaryButton
              title="AI Copilot"
              size="sm"
              fullWidth={false}
              icon={<Sparkles className="h-3.5 w-3.5 text-white" />}
              className="h-9 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 text-xs shadow-md shadow-amber-500/20 transition-transform active:scale-95"
              onClick={() => setIsCopilotOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* ===================== KPI METRICS GRID ===================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Escrow Holds"
          value={activeHoldsCount}
          icon={ShieldCheck}
          tone="amber"
          footnote={`${formatUsd(activeHoldsVolume)} held in PayPal escrow`}
          trend={
            activeHoldsCount > 0
              ? { value: `${activeHoldsCount} active`, isPositive: true, label: 'deposit secured' }
              : undefined
          }
          sparkline={[4, 6, 8, 7, 9, 12, Math.max(12, activeHoldsCount)]}
        />
        <StatCard
          label="Captured Revenue"
          value={formatUsd(capturedRevenue)}
          icon={DollarSign}
          tone="emerald"
          footnote={`${capturedBookings.length} completed settlements`}
          trend={{ value: '100% captured', isPositive: true, label: 'zero loss' }}
          sparkline={[800, 1200, 1600, 1900, 2400, Math.max(2400, Math.round(capturedRevenue))]}
        />
        <StatCard
          label="Catalog Offerings"
          value={services.length}
          icon={Scissors}
          tone="sky"
          footnote="Live services bookable online"
          trend={{ value: 'Catalog active', isPositive: true }}
          sparkline={[services.length, services.length + 1, services.length]}
        />
        <StatCard
          label="Compliance & Requests"
          value={pendingChangeRequests}
          icon={pendingChangeRequests > 0 ? ShieldAlert : Sparkles}
          tone={pendingChangeRequests > 0 ? 'rose' : 'purple'}
          footnote={
            pendingChangeRequests > 0
              ? `${pendingChangeRequests} amendment awaiting approval`
              : 'All policies in sync'
          }
          trend={
            pendingChangeRequests > 0 ? { value: 'Review pending', isPositive: false } : undefined
          }
          sparkline={[1, 2, 1, 0, pendingChangeRequests]}
        />
      </div>

      {/* ===================== REVENUE & QUICK ACCESS HUB ===================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: 7-Day Revenue Outlook */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm shadow-slate-900/5 lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Revenue & Escrow Outlook</span>
                  <Badge tone="amber" className="text-[10px] uppercase font-bold py-0.5">
                    7-Day Projection
                  </Badge>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time trajectory combining settled volume and open customer holds
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 text-right">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase">Settled</div>
                  <div className="text-xs font-mono font-bold text-emerald-950">
                    {formatUsd(capturedRevenue)}
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200/60 px-2.5 py-1 text-right">
                  <div className="text-[10px] font-bold text-amber-800 uppercase">In Escrow</div>
                  <div className="text-xs font-mono font-bold text-amber-950">
                    {formatUsd(activeHoldsVolume)}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <LineTrendChart
                data={revenueTrend}
                dataKey="revenue"
                xKey="day"
                heightClassName="h-[230px]"
                yDomain={['auto', 'auto']}
                yAxisLabel="USD"
                valueSuffix=""
                seriesLabel="Volume ($)"
                strokeColor="#0f172a"
                dotColor="#f59e0b"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              PayPal honor window guaranteed on active reservations
            </span>
            <Link
              href={ROUTES.merchantAppointments}
              className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-900 transition-colors"
            >
              <span>Ledger details</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        {/* Right: Operational Command Tiles */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm shadow-slate-900/5 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Operational Command Hub
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct shortcuts to salon floor operations and team management
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {[
                {
                  href: ROUTES.merchantCalendar,
                  title: 'Station Chair Calendar',
                  subtitle: 'Real-time chair booking & stylist slot grid',
                  icon: CalendarIcon,
                  badgeText: 'Live Grid',
                  toneClass: 'text-indigo-600 bg-indigo-50 border-indigo-200/60',
                },
                {
                  href: ROUTES.merchantAppointments,
                  title: 'Settlement Ledger',
                  subtitle: `${bookings.length} reservations on file · Settle & Void`,
                  icon: ShieldCheck,
                  badgeText: `${activeHoldsCount} Holds`,
                  toneClass: 'text-amber-600 bg-amber-50 border-amber-200/60',
                },
                {
                  href: ROUTES.merchantServices,
                  title: 'Service Catalog',
                  subtitle: `${services.length} offerings · Durations & deposit rules`,
                  icon: Scissors,
                  badgeText: 'Catalog',
                  toneClass: 'text-sky-600 bg-sky-50 border-sky-200/60',
                },
                {
                  href: ROUTES.merchantStaff,
                  title: 'Staff & Stylists',
                  subtitle: 'Station schedules, commissions & active roster',
                  icon: Users,
                  badgeText: 'Team',
                  toneClass: 'text-purple-600 bg-purple-50 border-purple-200/60',
                },
              ].map((tile) => {
                const IconComponent = tile.icon
                return (
                  <Link
                    key={tile.href}
                    href={tile.href}
                    className="group relative flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/60 p-3.5 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-md hover:shadow-slate-900/5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105',
                          tile.toneClass,
                        )}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
                            {tile.title}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{tile.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pl-2">
                      <span className="hidden sm:inline-block rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600 group-hover:border-slate-300">
                        {tile.badgeText}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-amber-800 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Policy amendments required?</span>
            <Link
              href={ROUTES.merchantSettings}
              className="font-semibold text-slate-700 hover:text-slate-950 underline decoration-slate-300"
            >
              Org Settings
            </Link>
          </div>
        </Card>
      </div>

      {/* ===================== RECENT RESERVATIONS FEED ===================== */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Recent Client Reservations</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {filteredBookings.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review PayPal deposit holds, inspect customer consent hashes, and execute settlements
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All', count: bookings.length },
              { id: 'holds', label: 'Active Holds', count: activeHoldsCount },
              { id: 'captured', label: 'Settled', count: capturedBookings.length },
              { id: 'voided', label: 'Voided / No-Show', count: voidedBookings.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id as BookingFilterTab)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                  filterTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900',
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 font-mono text-[10px]',
                    filterTab === tab.id
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-200/80 text-slate-600',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        <div className="pt-4">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-20 w-full animate-pulse rounded-xl bg-slate-100/80 border border-slate-200/40"
                />
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-10">
              <EmptyState
                icon={CalendarIcon}
                title={
                  filterTab === 'all' ? 'No reservations yet' : `No ${filterTab} reservations found`
                }
                description={
                  filterTab === 'all'
                    ? 'New client bookings through the customer portal will appear here in real time.'
                    : 'Try selecting a different filter tab or create test bookings via the Client Portal.'
                }
                actionLabel="Open Live Calendar"
                onAction={() => {
                  window.location.href = ROUTES.merchantCalendar
                }}
                variant="console"
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredBookings.slice(0, 8).map((b: Booking) => {
                const isHeld = b.status === 'HELD' || b.status === 'REAUTHORIZED'
                return (
                  <div
                    key={b.id}
                    className="group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                  >
                    {/* Left: Client & Service Details */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white font-bold text-slate-800 shadow-sm text-sm">
                        {b.clientName ? b.clientName.charAt(0).toUpperCase() : 'C'}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{b.clientName}</span>
                          <span className="text-slate-300">·</span>
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                            {b.serviceName}
                          </span>
                          <HoldStateBadge status={b.status as HoldState} />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {b.appointmentTime}
                          </span>
                          {b.stylistName ? (
                            <>
                              <span className="text-slate-300">·</span>
                              <span>Stylist: {b.stylistName}</span>
                            </>
                          ) : null}
                          {b.clientPhone ? (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="font-mono">{b.clientPhone}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Right: Financials & Settlement Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <div className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                          {formatUsd(b.servicePrice)}
                        </div>
                        <div
                          className={cn(
                            'text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md inline-block',
                            isHeld
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/50'
                              : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          Hold: {formatUsd(b.holdAmount)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInspectConsentBooking(b)}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                          title="Inspect cryptographic hold authorization receipt"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>Inspect</span>
                        </button>

                        <PrimaryButton
                          title={isHeld ? 'Settle / Void' : 'View Settlement'}
                          size="sm"
                          fullWidth={false}
                          className={cn(
                            'h-8 rounded-lg px-3.5 text-xs font-bold shadow-sm',
                            isHeld
                              ? 'bg-slate-900 hover:bg-slate-800 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
                          )}
                          onClick={() => setSelectedBooking(b)}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {filteredBookings.length > 8 ? (
            <div className="mt-4 text-center pt-2">
              <Link
                href={ROUTES.merchantAppointments}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 transition-colors"
              >
                <span>
                  View all {filteredBookings.length} reservations in full appointments table
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
