'use client'

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Layers,
  Loader2,
  Percent,
  RefreshCw,
  ShieldAlert,
  Sliders,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

import { Card } from '@/components/ui'
import { useAdminSession } from '@/hooks/use-admin-session'
import { ROUTES } from '@/lib/constants'
import { formatUsd } from '@/lib/format'
import { useGetAdminDashboardQuery } from '@/store/api/platformApi'

import { AdminQueryState } from './_components/admin-query-state'

export default function AdminOverviewPage() {
  const { skipAdminApi } = useAdminSession()
  const { data, isLoading, isError, refetch } = useGetAdminDashboardQuery(undefined, {
    skip: skipAdminApi,
  })

  if (skipAdminApi) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
        Checking session…
      </div>
    )
  }

  const totalOrgs = data?.total_organizations ?? 0
  const approvedOrgs = data?.approved_organizations ?? 0
  const pendingOrgs = data?.pending_organizations ?? 0
  const suspendedOrgs = data?.suspended_organizations ?? 0
  const approvedPct = totalOrgs > 0 ? Math.round((approvedOrgs / totalOrgs) * 100) : 0
  const pendingPct = totalOrgs > 0 ? Math.round((pendingOrgs / totalOrgs) * 100) : 0
  const suspendedPct = totalOrgs > 0 ? Math.round((suspendedOrgs / totalOrgs) * 100) : 0

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError || !data}
      onRetry={() => void refetch()}
      loadingLabel="Loading dashboard…"
      errorLabel="Could not load admin dashboard."
    >
      {data ? (
        <div className="mx-auto w-full max-w-7xl space-y-7 animate-in fade-in duration-300">
          {/* Executive Header Banner */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/60 to-amber-50/20 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] sm:p-6">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-gradient-to-br from-amber-400/15 via-sky-400/10 to-transparent blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/80 bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-800 text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Multi-Tenant Platform Active
                  </span>
                  <span className="text-slate-300 text-xs">·</span>
                  <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-mono">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    FastAPI + pgvector Engine
                  </span>
                </div>
                <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight sm:text-3xl">
                  Platform Operations
                </h1>
                <p className="max-w-2xl text-xs sm:text-sm text-slate-600">
                  Global governance for salon tenants, PayPal authorization hold reserves, take-rate
                  splits, and operational ledger tracking.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 text-xs shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                  title="Refresh dashboard metrics"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                  <span>Sync Metrics</span>
                </button>
                <Link
                  href={ROUTES.adminSalons ?? '/admin/salons'}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-stone-950 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-stone-800"
                >
                  <span>Review Salons</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Salons Network
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
                  {totalOrgs}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-semibold text-emerald-600">{approvedOrgs} active</span>
                  <span>·</span>
                  <span>{pendingOrgs} pending review</span>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Pending Approvals
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
                  {pendingOrgs + data.pending_change_requests}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-medium text-amber-700">{pendingOrgs} salons</span>
                  <span>·</span>
                  <span>{data.pending_change_requests} policy/paypal CRs</span>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Settled Volume
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
                  {formatUsd(Number(data.ledger_amount_sum))}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <span>From {data.ledger_entry_count} audit ledger entries</span>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Policy Change Requests
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Sliders className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
                  {data.pending_change_requests}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Merchant account modifications</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Network Health Breakdown & Operational Ledger Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Salon Network Health */}
            <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                    Salon Network Health
                  </h2>
                  <p className="text-xs text-slate-500">
                    Distribution of tenant salons across verification lifecycles.
                  </p>
                </div>
                <Link
                  href={ROUTES.adminSalons ?? '/admin/salons'}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Progress bar representing status proportions */}
              <div className="space-y-2">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                  {approvedPct > 0 && (
                    <div
                      style={{ width: `${approvedPct}%` }}
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      title={`Approved: ${approvedPct}%`}
                    />
                  )}
                  {pendingPct > 0 && (
                    <div
                      style={{ width: `${pendingPct}%` }}
                      className="h-full rounded-full bg-amber-400 transition-all duration-500 ml-0.5"
                      title={`Pending: ${pendingPct}%`}
                    />
                  )}
                  {suspendedPct > 0 && (
                    <div
                      style={{ width: `${suspendedPct}%` }}
                      className="h-full rounded-full bg-rose-500 transition-all duration-500 ml-0.5"
                      title={`Suspended: ${suspendedPct}%`}
                    />
                  )}
                </div>
              </div>

              {/* Status details 3-column stats */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Approved</span>
                  </div>
                  <div className="mt-1.5 text-xl font-extrabold text-slate-900">{approvedOrgs}</div>
                  <div className="text-[11px] text-slate-500">{approvedPct}% of network</div>
                </div>

                <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span>Pending</span>
                  </div>
                  <div className="mt-1.5 text-xl font-extrabold text-slate-900">{pendingOrgs}</div>
                  <div className="text-[11px] text-slate-500">{pendingPct}% awaiting review</div>
                </div>

                <div className="rounded-lg border border-rose-100 bg-rose-50/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                    <span>Suspended</span>
                  </div>
                  <div className="mt-1.5 text-xl font-extrabold text-slate-900">
                    {suspendedOrgs}
                  </div>
                  <div className="text-[11px] text-slate-500">{suspendedPct}% quarantined</div>
                </div>
              </div>
            </Card>

            {/* Platform Governance & Quick Tools */}
            <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] lg:col-span-5 flex flex-col justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  Platform Quick Navigation
                </h2>
                <p className="text-xs text-slate-500">Direct shortcuts to admin consoles.</p>

                <div className="mt-3.5 space-y-2">
                  <Link
                    href={ROUTES.adminSalons ?? '/admin/salons'}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-xs transition-all hover:bg-slate-100/80 hover:border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Salons Directory</div>
                        <div className="text-[11px] text-slate-500">
                          {totalOrgs} registered organizations
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>

                  <Link
                    href="/admin/requests"
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-xs transition-all hover:bg-slate-100/80 hover:border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                        <Sliders className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Change Requests</div>
                        <div className="text-[11px] text-slate-500">
                          {data.pending_change_requests} awaiting review
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>

                  <Link
                    href="/admin/commission"
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-xs transition-all hover:bg-slate-100/80 hover:border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <Percent className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Commission Rates</div>
                        <div className="text-[11px] text-slate-500">
                          Take-rate overrides & splits
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>

                  <Link
                    href="/admin/taxonomy"
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-xs transition-all hover:bg-slate-100/80 hover:border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                        <Layers className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Service Taxonomy</div>
                        <div className="text-[11px] text-slate-500">Category classification</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Immutable PostgreSQL Audit Ledger</span>
                <span className="font-mono">{data.ledger_entry_count} entries</span>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </AdminQueryState>
  )
}
