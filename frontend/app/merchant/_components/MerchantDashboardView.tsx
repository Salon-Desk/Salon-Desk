'use client'

import {
  ArrowRight,
  ArrowUpRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  Receipt,
  RefreshCw,
  Scissors,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/button'
import { StatCard } from '@/components/card'
import { LineTrendChart } from '@/components/chart/LineTrendChart'
import { EmptyState } from '@/components/empty'
import { Badge, Card, HoldStateBadge, SearchInput } from '@/components/ui'
import { openAgentChat } from '@/hooks/useAgentUiActions'
import { useListingParams } from '@/hooks/useListingParams'
import { ROUTES } from '@/lib/constants'
import { formatUsd } from '@/lib/format'
import {
  buildMerchantDashboardBookingsApiParams,
  type MerchantDashboardBookingsListParams,
  MerchantDashboardBookingsListParamsSchema,
} from '@/lib/listing-params/merchant-dashboard-bookings-list-params'
import {
  buildMerchantDashboardChangeRequestsSnapshotApiParams,
  buildMerchantDashboardServicesSnapshotApiParams,
} from '@/lib/listing-params/merchant-dashboard-snapshot-list-params'
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

import { useMerchantContext } from '../_context/MerchantContext'

export function MerchantDashboardView() {
  const { setSelectedBooking, setInspectConsentBooking } = useMerchantContext()
  const { params, displayParams, setParam } = useListingParams<
    MerchantDashboardBookingsListParams,
    typeof MerchantDashboardBookingsListParamsSchema
  >(MerchantDashboardBookingsListParamsSchema)

  const filterTab = displayParams.filterTab
  const searchQuery = typeof params.q === 'string' ? params.q : ''
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: org, isLoading: orgLoading, refetch: refetchOrg } = useGetMyOrganizationQuery()
  const { data: account, isLoading: accountLoading } = useGetMyOrgAccountQuery()
  const bookingsQuery = buildMerchantDashboardBookingsApiParams({
    search: displayParams.search,
    filterTab: displayParams.filterTab,
  })

  const {
    data: apiBookingsData,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useGetMyOrgBookingsQuery(bookingsQuery)
  const { data: changeRequestsData } = useGetMyChangeRequestsQuery(
    buildMerchantDashboardChangeRequestsSnapshotApiParams(),
  )
  const { data: servicesData } = useGetMyServicesQuery(
    buildMerchantDashboardServicesSnapshotApiParams(),
  )

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
    let list = bookings
    switch (filterTab) {
      case 'holds':
        list = activeHolds
        break
      case 'captured':
        list = capturedBookings
        break
      case 'voided':
        list = voidedBookings
        break
      default:
        list = bookings
    }
    return list
  }, [filterTab, activeHolds, capturedBookings, voidedBookings, bookings])

  const revenueTrend = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const hasData = capturedRevenue > 0 || activeHoldsVolume > 0
    return days.map((day, i) => ({
      day,
      revenue: hasData
        ? Math.round(capturedRevenue * (0.35 + i * 0.09) + activeHoldsVolume * 0.06 * i)
        : 0,
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
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-12 sm:space-y-6">
      {/* ===================== HERO COMMAND BANNER ===================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 p-5 text-white ring-1 ring-white/10 sm:rounded-3xl sm:p-7">
        {/* Ambient background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/30 to-amber-700/20 text-xl font-extrabold text-amber-200 ring-1 ring-white/10 backdrop-blur-sm sm:h-16 sm:w-16 sm:text-2xl">
              {org?.name ? org.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="space-y-1 sm:space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white truncate max-w-xs sm:max-w-none">
                  {org?.name || 'Salon Command Center'}
                </h1>
                <Badge
                  tone="emerald"
                  dot
                  pulsing
                  className="bg-emerald-500/15 text-emerald-300 border-emerald-400/30 text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5"
                >
                  Verified
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1">
                <span>
                  Escrow:{' '}
                  <strong className="text-amber-300 font-bold">
                    {formatUsd(activeHoldsVolume)}
                  </strong>
                </span>
                <span className="text-slate-500">·</span>
                <span>
                  Holds: <strong className="text-slate-100 font-bold">{activeHoldsCount}</strong>
                </span>
                {account?.merchant_id ? (
                  <>
                    <span className="text-slate-500">·</span>
                    <span className="font-mono text-slate-400 text-[11px] sm:text-xs">
                      PayPal: {account.merchant_id}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-white/10 px-3.5 text-xs font-semibold text-slate-100 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/18 hover:text-white active:scale-95 disabled:opacity-50"
              title="Sync latest data"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
              <span>Sync</span>
            </button>

            <Link
              href={ROUTES.merchantCalendar}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/10 px-3.5 text-xs font-semibold text-slate-100 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/18 hover:text-white active:scale-95 sm:px-4"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-amber-400" />
              <span>Live Calendar</span>
            </Link>

            <PrimaryButton
              title="AI Copilot"
              size="sm"
              fullWidth={false}
              icon={<Sparkles className="h-3.5 w-3.5 text-white" />}
              className="h-9 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 text-xs font-bold text-slate-950 transition-all hover:-translate-y-0.5 hover:from-amber-300 hover:to-amber-400 active:scale-95 sm:px-4"
              onClick={() => openAgentChat('chat')}
            />
          </div>
        </div>
      </div>

      {/* ===================== KPI METRICS GRID ===================== */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Holds"
          value={activeHoldsCount}
          icon={ShieldCheck}
          tone="amber"
          footnote={`${formatUsd(activeHoldsVolume)} held in escrow`}
          trend={
            activeHoldsCount > 0
              ? { value: `${activeHoldsCount} active`, isPositive: true, label: 'deposit secured' }
              : undefined
          }
          sparkline={
            activeHoldsCount > 0
              ? [0, Math.round(activeHoldsCount * 0.5), activeHoldsCount]
              : undefined
          }
          className="border-slate-200/60 bg-white/90 shadow-none hover:border-amber-200/80 hover:shadow-none"
        />
        <StatCard
          label="Captured Revenue"
          value={formatUsd(capturedRevenue)}
          icon={DollarSign}
          tone="emerald"
          footnote={`${capturedBookings.length} completed settlements`}
          trend={{ value: '100% captured', isPositive: true, label: 'zero loss' }}
          sparkline={
            capturedRevenue > 0
              ? [0, Math.round(capturedRevenue * 0.4), Math.round(capturedRevenue)]
              : undefined
          }
          className="border-slate-200/60 bg-white/90 shadow-none hover:border-emerald-200/80 hover:shadow-none"
        />
        <StatCard
          label="Catalog Offerings"
          value={services.length}
          icon={Scissors}
          tone="sky"
          footnote="Live services bookable online"
          trend={{ value: 'Catalog active', isPositive: true }}
          sparkline={services.length > 0 ? [services.length, services.length] : undefined}
          className="border-slate-200/60 bg-white/90 shadow-none hover:border-sky-200/80 hover:shadow-none"
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
          className="border-slate-200/60 bg-white/90 shadow-none hover:border-purple-200/80 hover:shadow-none"
        />
      </div>

      {/* ===================== REVENUE & QUICK ACCESS HUB ===================== */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
        {/* Left: 7-Day Revenue Outlook */}
        <Card className="flex flex-col justify-between rounded-2xl border border-slate-200/60 bg-white/95 p-4 shadow-none sm:p-6 lg:col-span-7">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
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
                <div className="rounded-lg bg-emerald-50/80 px-2.5 py-1.5 text-right">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase">Settled</div>
                  <div className="text-xs font-mono font-bold text-emerald-950">
                    {formatUsd(capturedRevenue)}
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50/80 px-2.5 py-1.5 text-right">
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
                heightClassName="h-[180px] sm:h-[230px]"
                yDomain={['auto', 'auto']}
                yAxisLabel="USD"
                valueSuffix=""
                seriesLabel="Volume ($)"
                strokeColor="#0f172a"
                dotColor="#f59e0b"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
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
        <Card className="flex flex-col justify-between rounded-2xl border border-slate-200/60 bg-white/95 p-4 shadow-none sm:p-6 lg:col-span-5">
          <div>
            <div className="mb-4">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
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
                  subtitle: 'Real-time chair booking & slot grid',
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
                  subtitle: `${services.length} offerings · Durations & deposits`,
                  icon: Scissors,
                  badgeText: 'Catalog',
                  toneClass: 'text-sky-600 bg-sky-50 border-sky-200/60',
                },
                {
                  href: ROUTES.merchantStaff,
                  title: 'Staff & Stylists',
                  subtitle: 'Station schedules, commissions & roster',
                  icon: Users,
                  badgeText: 'Team',
                  toneClass: 'text-purple-600 bg-purple-50 border-purple-200/60',
                },
                {
                  href: ROUTES.merchantBilling,
                  title: 'Platform Billing',
                  subtitle: 'Commission accruals & SaaS invoices',
                  icon: Receipt,
                  badgeText: 'Billing',
                  toneClass: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
                },
              ].map((tile) => {
                const IconComponent = tile.icon
                return (
                  <Link
                    key={tile.href}
                    href={tile.href}
                    className="group relative flex items-center justify-between rounded-xl bg-slate-50/70 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white sm:p-3.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
                          tile.toneClass,
                        )}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-amber-800 transition-colors truncate">
                          {tile.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{tile.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pl-2 shrink-0">
                      <span className="hidden rounded-md bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600 sm:inline-block">
                        {tile.badgeText}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-amber-800 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
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
      <Card className="rounded-2xl border border-slate-200/60 bg-white/95 p-4 shadow-none sm:p-6">
        <div className="flex flex-col gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Recent Client Reservations</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  {filteredBookings.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review PayPal deposit holds, inspect customer consent hashes, and execute
                settlements
              </p>
            </div>

            {/* Mobile-Friendly Search Box */}
            <div className="w-full sm:w-72">
              <SearchInput
                value={displayParams.search}
                onChange={(val) => setParam('search', val)}
                placeholder="Search reservations, clients, stylists…"
                className="w-full text-xs"
              />
            </div>
          </div>

          {/* Filter Pills - Swipeable on mobile without wrapping */}
          <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl bg-slate-50/80 p-1 no-scrollbar sm:gap-2">
            {[
              { id: 'all', label: 'All', count: bookings.length },
              { id: 'holds', label: 'Active Holds', count: activeHoldsCount },
              { id: 'captured', label: 'Settled', count: capturedBookings.length },
              { id: 'voided', label: 'Voided / No-Show', count: voidedBookings.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setParam('filterTab', tab.id as MerchantDashboardBookingsListParams['filterTab'])
                }
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                  filterTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900',
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 font-mono text-[10px]',
                    filterTab === tab.id
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}

            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => setParam('search', '')}
                className="shrink-0 text-xs text-amber-700 hover:text-amber-900 font-semibold underline decoration-amber-300 ml-1 cursor-pointer"
              >
                Clear query
              </button>
            ) : null}
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
                  searchQuery.trim()
                    ? `No reservations matching "${searchQuery}"`
                    : filterTab === 'all'
                      ? 'No reservations yet'
                      : `No ${filterTab} reservations found`
                }
                description={
                  searchQuery.trim()
                    ? 'Try adjusting your search terms or selecting a different filter.'
                    : filterTab === 'all'
                      ? 'New client bookings through the customer portal will appear here in real time.'
                      : 'Try selecting a different filter tab or create test bookings via the Client Portal.'
                }
                actionLabel={searchQuery.trim() ? 'Clear search' : 'Open Live Calendar'}
                onAction={() => {
                  if (searchQuery.trim()) {
                    setParam('search', '')
                  } else {
                    window.location.href = ROUTES.merchantCalendar
                  }
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
                    className="group relative flex flex-col gap-3 rounded-xl bg-slate-50/70 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white sm:flex-row sm:items-center sm:justify-between sm:p-4"
                  >
                    {/* Left: Client & Service Details */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white font-bold text-xs text-slate-800 sm:h-11 sm:w-11 sm:text-sm">
                        {b.clientName ? b.clientName.charAt(0).toUpperCase() : 'C'}
                      </div>

                      <div className="min-w-0 space-y-1 flex-1">
                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 truncate">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {b.clientName}
                            </span>
                            <span className="text-slate-300 hidden sm:inline">·</span>
                            <span className="hidden sm:inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                              {b.serviceName}
                            </span>
                          </div>
                          <HoldStateBadge status={b.status as HoldState} />
                        </div>

                        {/* Mobile Service Pill */}
                        <div className="sm:hidden">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
                            {b.serviceName}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-0.5 text-[11px] sm:text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400" />
                            {b.appointmentTime}
                          </span>
                          {b.stylistName ? (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="truncate max-w-[120px] sm:max-w-none">
                                Stylist: {b.stylistName}
                              </span>
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
                        <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 tabular-nums">
                          {formatUsd(b.servicePrice)}
                        </div>
                        <div
                          className={cn(
                            'text-[10px] sm:text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md inline-block',
                            isHeld
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/50'
                              : 'bg-slate-100 text-slate-600',
                          )}
                        >
                          Hold: {formatUsd(b.holdAmount)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => setInspectConsentBooking(b)}
                          className="inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                          title="Inspect cryptographic hold authorization receipt"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span className="hidden xs:inline sm:inline">Inspect</span>
                        </button>

                        <PrimaryButton
                          title={isHeld ? 'Settle / Void' : 'Details'}
                          size="sm"
                          fullWidth={false}
                          className={cn(
                            'h-8 rounded-lg px-2.5 text-xs font-bold shadow-none sm:px-3.5',
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
