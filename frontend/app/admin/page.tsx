'use client'

import { Building2, CreditCard, Loader2, Percent, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

import { Card, StatCard } from '@/components/ui'
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

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError || !data}
      onRetry={() => void refetch()}
      loadingLabel="Loading dashboard…"
      errorLabel="Could not load admin dashboard."
    >
      {data ? (
        <div className="mx-auto w-full max-w-6xl space-y-6 animate-in fade-in duration-300">
          <div>
            <h1 className="font-extrabold text-xl text-slate-900 sm:text-2xl">Platform overview</h1>
            <p className="text-xs text-slate-500">Live metrics from `/api/v1/admin/dashboard`.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Organizations"
              value={String(data.total_organizations)}
              icon={Building2}
            />
            <StatCard
              label="Pending salons"
              value={String(data.pending_organizations)}
              icon={ShieldCheck}
            />
            <StatCard
              label="Pending CRs"
              value={String(data.pending_change_requests)}
              icon={Percent}
            />
            <StatCard
              label="Ledger sum"
              value={formatUsd(Number(data.ledger_amount_sum))}
              icon={CreditCard}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Approved
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {data.approved_organizations}
              </p>
            </Card>
            <Card className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Suspended
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {data.suspended_organizations}
              </p>
            </Card>
            <Card className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Ledger entries
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{data.ledger_entry_count}</p>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={ROUTES.adminSalons ?? '/admin/salons'}
              className="rounded-full bg-stone-950 px-4 py-2 text-xs font-medium text-white"
            >
              Review salons
            </Link>
            <Link
              href="/admin/requests"
              className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-800"
            >
              Change requests
            </Link>
            <Link
              href="/admin/taxonomy"
              className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-800"
            >
              Taxonomy
            </Link>
          </div>
        </div>
      ) : null}
    </AdminQueryState>
  )
}
