'use client'

import { ArrowRight, Building2, Clock, CreditCard, Loader2, RefreshCw, Sliders } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { LineTrendChart } from '@/components/chart/LineTrendChart'
import { Card, EmptyState } from '@/components/ui'
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
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
        Checking session…
      </div>
    )
  }

  const totalOrgs = data?.total_organizations ?? 0
  const pendingQueue = (data?.pending_organizations ?? 0) + (data?.pending_change_requests ?? 0)

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError || !data}
      onRetry={() => void refetch()}
      loadingLabel="Loading dashboard…"
      errorLabel="Could not load admin dashboard."
    >
      {data ? (
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Overview
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                {totalOrgs} salons · {data.ledger_entry_count} ledger entries
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void refetch()}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
              <Link
                href={ROUTES.adminSalons ?? '/admin/salons'}
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-950 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white hover:bg-stone-800"
              >
                Review salons
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
            {[
              {
                label: 'Salons',
                value: String(totalOrgs),
                hint: `${data.approved_organizations} approved`,
                icon: Building2,
              },
              {
                label: 'Needs review',
                value: String(pendingQueue),
                hint: `${data.pending_change_requests} change requests`,
                icon: Clock,
              },
              {
                label: 'Settled volume',
                value: formatUsd(Number(data.ledger_amount_sum)),
                hint: `${data.ledger_entry_count} entries`,
                icon: CreditCard,
              },
              {
                label: 'Change requests',
                value: String(data.pending_change_requests),
                hint: 'Awaiting approval',
                icon: Sliders,
              },
            ].map((kpi) => (
              <Card
                key={kpi.label}
                className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-none"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {kpi.label}
                  </span>
                  <kpi.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
                </div>
                <p className="mt-2 sm:mt-3 text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate">
                  {kpi.value}
                </p>
                <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500 truncate">
                  {kpi.hint}
                </p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-none lg:col-span-7">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-900">Settled volume trend</h2>
                <p className="text-xs text-slate-500">Derived from current ledger total</p>
              </div>
              <LineTrendChart
                data={volumeTrend}
                dataKey="volume"
                xKey="day"
                heightClassName="h-[180px] sm:h-[220px]"
                yDomain={['auto', 'auto']}
                yAxisLabel="USD"
                valueSuffix=""
                seriesLabel="Volume"
              />
            </Card>

            <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-none lg:col-span-5">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-900">Network mix</h2>
                <p className="text-xs text-slate-500">Salon verification status</p>
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
                          innerRadius={52}
                          outerRadius={74}
                          paddingAngle={3}
                        >
                          {distribution.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {distribution.map((d) => (
                      <div
                        key={d.name}
                        className="flex items-center justify-between text-xs text-slate-600"
                      >
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          {d.name}
                        </span>
                        <span className="font-semibold text-slate-900">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </AdminQueryState>
  )
}
