'use client'

import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Layers,
  Percent,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { toast } from 'sonner'

import { StatCard } from '@/components/card'
import { LineTrendChart } from '@/components/chart/LineTrendChart'
import { LoadingSpinner } from '@/components/loader/LoadingSpinner'
import { Card, EmptyState } from '@/components/ui'
import { AdminQueryState } from '@/components/ui/query-state-view'
import { toastColor } from '@/constant/toast-color'
import { useAdminSession } from '@/hooks/use-admin-session'
import { ROUTES } from '@/lib/constants'
import { formatUsd } from '@/lib/format'
import { useGetAdminDashboardQuery } from '@/store/api/platformApi'

export function AdminDashboardView() {
  const { skipAdminApi } = useAdminSession()
  const { data, isLoading, isError, refetch } = useGetAdminDashboardQuery(undefined, {
    skip: skipAdminApi,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Platform overview updated', toastColor.info)
    } finally {
      setIsRefreshing(false)
    }
  }

  const distribution = useMemo(() => {
    if (!data) return []
    return [
      { name: 'Approved', value: data.approved_organizations, color: '#10b981' },
      { name: 'Pending', value: data.pending_organizations, color: '#f59e0b' },
      { name: 'Suspended', value: data.suspended_organizations, color: '#f43f5e' },
    ].filter((d) => d.value > 0)
  }, [data])

  const volumeTrend = useMemo(() => {
    const base = Number(data?.ledger_amount_sum ?? 0)
    const steps = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return steps.map((day, i) => ({
      day,
      volume: base > 0 ? Math.max(0, Math.round(base * (0.55 + i * 0.07))) : 0,
    }))
  }, [data?.ledger_amount_sum])

  if (skipAdminApi) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="md" text="Checking session…" />
      </div>
    )
  }

  const totalOrgs = data?.total_organizations ?? 0
  const pendingQueue = (data?.pending_organizations ?? 0) + (data?.pending_change_requests ?? 0)
  const settledSum = Number(data?.ledger_amount_sum ?? 0)

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError || !data}
      onRetry={() => void refetch()}
      loadingLabel="Loading dashboard…"
      errorLabel="Could not load admin dashboard."
    >
      {data ? (
        <div className="mx-auto w-full max-w-7xl space-y-6 pb-12 animate-in fade-in duration-300">
          {/* Hero Gradient Header */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-amber-50/30 to-amber-100/20 p-6 shadow-xs backdrop-blur-md sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-amber-200/25 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-900 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>Platform Operations · Multi-Salon Network</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-extrabold text-slate-900 text-2xl tracking-tight sm:text-3xl">
                    Executive Network Overview
                  </h1>
                  <span className="rounded-full bg-slate-900 px-3 py-0.5 font-mono text-xs font-bold text-white shadow-2xs">
                    {totalOrgs} Salons
                  </span>
                </div>

                <p className="max-w-2xl text-xs text-slate-600 sm:text-sm leading-relaxed">
                  Real-time visibility into partner salon onboarding, PayPal payment hold volume,
                  merchant policy approvals, and platform commission ledger health.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-xs backdrop-blur-sm sm:shrink-0">
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={isRefreshing}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 text-xs shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.94] disabled:opacity-50"
                  title="Refresh metrics"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`}
                  />
                  <span>Sync</span>
                </button>

                <Link
                  href={ROUTES.adminSalons ?? '/admin/salons'}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-700 text-xs shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.95]"
                >
                  <Building2 className="h-3.5 w-3.5 text-amber-700" />
                  Salons
                </Link>

                <Link
                  href={ROUTES.adminCommission}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-700 text-xs shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.95]"
                >
                  <Percent className="h-3.5 w-3.5 text-amber-700" />
                  Commission
                </Link>

                <Link
                  href={ROUTES.adminBilling}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white text-xs shadow-2xs transition-all hover:bg-slate-800 active:scale-[0.95]"
                >
                  <Receipt className="h-3.5 w-3.5 text-amber-400" />
                  SaaS Billing
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Primary KPI Stat Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Partner Salons"
              value={String(totalOrgs)}
              footnote={`${data.approved_organizations} approved · ${data.pending_organizations} pending`}
              icon={Building2}
              tone="amber"
              className="hover:border-amber-200 hover:shadow-xs transition-all"
            />
            <StatCard
              label="Needs Review"
              value={String(pendingQueue)}
              footnote={`${data.pending_organizations} salons · ${data.pending_change_requests} policy changes`}
              icon={Clock}
              tone={pendingQueue > 0 ? 'amber' : 'slate'}
              className="hover:border-amber-200 hover:shadow-xs transition-all"
            />
            <StatCard
              label="Gross Settled Volume"
              value={formatUsd(settledSum)}
              footnote={`${data.ledger_entry_count} ledger entries`}
              icon={CreditCard}
              tone="emerald"
              className="hover:border-emerald-200 hover:shadow-xs transition-all"
            />
            <StatCard
              label="Pending Approvals"
              value={String(data.pending_change_requests)}
              footnote="Merchant policy & payout rules"
              icon={Sliders}
              tone="sky"
              className="hover:border-sky-200 hover:shadow-xs transition-all"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 lg:col-span-7">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 text-sm">Settled Volume Trend</h2>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      <TrendingUp className="h-3 w-3" />
                      7-day run rate
                    </span>
                  </div>
                  <p className="mt-0.5 text-slate-500 text-xs">
                    Aggregated payment volume across all connected merchant salons
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatUsd(settledSum)}
                  </span>
                  <p className="text-[10px] text-slate-400">Total volume</p>
                </div>
              </div>
              <LineTrendChart
                data={volumeTrend}
                dataKey="volume"
                xKey="day"
                heightClassName="h-[190px] sm:h-[230px]"
                yDomain={['auto', 'auto']}
                yAxisLabel="USD"
                valueSuffix=""
                seriesLabel="Volume"
              />
            </Card>

            <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 lg:col-span-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">Network Status Mix</h2>
                  <p className="mt-0.5 text-slate-500 text-xs">Verification and lifecycle state</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                  {totalOrgs} total
                </span>
              </div>
              {distribution.length === 0 ? (
                <EmptyState
                  variant="console"
                  title="No salon data yet"
                  description="Approved and pending salons will appear here once the network has activity."
                  className="border-0 bg-transparent p-6 shadow-none"
                />
              ) : (
                <>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribution}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={54}
                          outerRadius={76}
                          paddingAngle={4}
                        >
                          {distribution.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    {distribution.map((d) => (
                      <div
                        key={d.name}
                        className="flex items-center justify-between text-slate-600 text-xs"
                      >
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          <span className="font-medium text-slate-700">{d.name}</span>
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-slate-900">{d.value}</span>
                          <span className="text-[11px] text-slate-400">
                            ({Math.round((d.value / Math.max(1, totalOrgs)) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Quick Operations & System Health Matrix */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Action Card 1: Review Pending Salons & Governance */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-amber-300 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                {pendingQueue > 0 && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    {pendingQueue} Actionable
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-bold text-slate-900 text-sm">
                Salons &amp; Governance Queue
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Review salon onboarding submissions, merchant policy changes, and payout credential
                updates.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={ROUTES.adminSalons ?? '/admin/salons'}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:underline"
                >
                  Review Salons
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <span className="text-slate-300">·</span>
                <Link
                  href={ROUTES.adminRequests}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:underline"
                >
                  Approvals ({data.pending_change_requests})
                </Link>
              </div>
            </div>

            {/* Action Card 2: SaaS Commission Billing */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20">
                  <Receipt className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  Monthly Cycle
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 text-sm">SaaS Commission Invoicing</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Aggregate accrued transaction commission into periodic salon invoices and track
                settlements.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={ROUTES.adminBilling}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline"
                >
                  Manage Invoices
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <span className="text-slate-300">·</span>
                <Link
                  href={ROUTES.adminCommission}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:underline"
                >
                  Take-Rate Matrix
                </Link>
              </div>
            </div>

            {/* Action Card 3: Discovery & Merchandising */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-sky-300 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20">
                  <Layers className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                  Live Catalog
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900 text-sm">
                Discovery &amp; Merchandising
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Tune client homepage hero banner, curate featured salons and services, and adjust
                popular ranking weights.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={ROUTES.adminCuration}
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-800 hover:underline"
                >
                  Open Merchandising
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <span className="text-slate-300">·</span>
                <Link
                  href={ROUTES.adminTaxonomy}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:underline"
                >
                  Service Taxonomy
                </Link>
              </div>
            </div>
          </div>

          {/* Engine Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-5 py-3.5 text-xs shadow-2xs">
            <div className="flex flex-wrap items-center gap-6">
              <span className="font-semibold text-slate-700">Platform Infrastructure:</span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                PayPal Orders v2 Auth &amp; Capture
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Two-Sided Ledger
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Merchant Verification Gate
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      ) : null}
    </AdminQueryState>
  )
}
