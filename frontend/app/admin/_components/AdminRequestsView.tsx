'use client'

import { CheckCircle2, Clock, RefreshCw, Sliders, Sparkles, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { StatCard } from '@/components/card'
import { Badge, Card, EmptyState, SearchInput } from '@/components/ui'
import { Pagination } from '@/components/ui/pagination'
import { AdminQueryState } from '@/components/ui/query-state-view'
import { toastColor } from '@/constant/toast-color'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useAgentUiActions } from '@/hooks/useAgentUiActions'
import { useListingParams } from '@/hooks/useListingParams'
import {
  type AdminRequestsListParams,
  AdminRequestsListParamsSchema,
  buildAdminRequestsCountApiParams,
} from '@/lib/listing-params/admin-requests-list-params'
import { useGetAdminChangeRequestsQuery } from '@/store/api/platformApi'

import { ChangeRequestReviewActions } from './ChangeRequestReviewActions'
import { PayloadParameterCard } from './PayloadParameterCard'

const FILTER_LABELS: Record<AdminRequestsListParams['status'], string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  all: 'All',
}

export function AdminRequestsView() {
  const { skipAdminApi } = useAdminSession()
  const { params, displayParams, setParam, setParams } = useListingParams<
    AdminRequestsListParams,
    typeof AdminRequestsListParamsSchema
  >(AdminRequestsListParamsSchema)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useAgentUiActions({
    onFilterPolicyRequests: () => {
      setParams({ search: 'CANCELLATION_POLICY', page: 1 })
    },
    onFilterPaypalRequests: () => {
      setParams({ search: 'PAYPAL_ACCOUNT', page: 1 })
    },
  })

  const {
    data: requestsData,
    isLoading,
    isError,
    refetch,
  } = useGetAdminChangeRequestsQuery(params, {
    skip: skipAdminApi,
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Governance queue updated', toastColor.info)
    } finally {
      setIsRefreshing(false)
    }
  }

  const paginatedRequests = requestsData?.items ?? []
  const totalItems = requestsData?.total ?? paginatedRequests.length
  const currentPage = displayParams.page
  const pageSize = displayParams.limit
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const { data: allCountData } = useGetAdminChangeRequestsQuery(
    buildAdminRequestsCountApiParams('all'),
    {
      skip: skipAdminApi,
    },
  )
  const { data: pendingCountData } = useGetAdminChangeRequestsQuery(
    buildAdminRequestsCountApiParams('PENDING'),
    { skip: skipAdminApi },
  )
  const { data: approvedCountData } = useGetAdminChangeRequestsQuery(
    buildAdminRequestsCountApiParams('APPROVED'),
    { skip: skipAdminApi },
  )
  const { data: rejectedCountData } = useGetAdminChangeRequestsQuery(
    buildAdminRequestsCountApiParams('REJECTED'),
    {
      skip: skipAdminApi,
    },
  )

  const counts = useMemo(
    () => ({
      all: allCountData?.total ?? 0,
      PENDING: pendingCountData?.total ?? 0,
      APPROVED: approvedCountData?.total ?? 0,
      REJECTED: rejectedCountData?.total ?? 0,
    }),
    [
      allCountData?.total,
      pendingCountData?.total,
      approvedCountData?.total,
      rejectedCountData?.total,
    ],
  )

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-amber-50/25 to-amber-100/20 p-6 shadow-xs backdrop-blur-md sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-amber-200/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-900 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Merchant Governance · Policy &amp; Payout Amendments</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-extrabold text-slate-900 text-2xl tracking-tight sm:text-3xl">
                Change Request Governance
              </h1>
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-2xs">
                {counts.PENDING} Actionable
              </span>
            </div>

            <p className="max-w-2xl text-xs text-slate-600 sm:text-sm leading-relaxed">
              Review, approve, and audit salon merchant policy updates (free cancellation windows,
              no-show penalties) and PayPal payout configuration changes.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-xs backdrop-blur-sm">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-700 text-xs shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.94] disabled:opacity-50"
              title="Refresh requests"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`}
              />
              <span>Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Pending Review"
          value={String(counts.PENDING)}
          footnote="Requires platform administrator decision"
          icon={Clock}
          tone={counts.PENDING > 0 ? 'amber' : 'slate'}
          className="hover:border-amber-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Approved Policies"
          value={String(counts.APPROVED)}
          footnote="Merged into active salon policies"
          icon={CheckCircle2}
          tone="emerald"
          className="hover:border-emerald-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Rejected Amendments"
          value={String(counts.REJECTED)}
          footnote="Declined compliance changes"
          icon={XCircle}
          tone="rose"
          className="hover:border-rose-200 hover:shadow-xs transition-all"
        />
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
        <SearchInput
          value={displayParams.search}
          onChange={(val) => setParams({ search: val, page: 1 })}
          placeholder="Search by org ID, request ID, or payload details…"
          className="w-full sm:max-w-xs text-xs"
        />

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(['PENDING', 'APPROVED', 'REJECTED', 'all'] as const).map((key) => {
            const isActive = displayParams.status === key
            const count = counts[key]

            return (
              <button
                key={key}
                type="button"
                onClick={() => setParams({ status: key, page: 1 })}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold capitalize transition-all cursor-pointer active:scale-[0.98] ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{FILTER_LABELS[key]}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <AdminQueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loadingLabel="Loading change requests…"
        errorLabel="Could not load change requests."
      >
        {paginatedRequests.length === 0 ? (
          <EmptyState
            icon={Sliders}
            title="No change requests found"
            description="Merchant policy and PayPal configuration amendments appear here for platform review."
          />
        ) : (
          <div className="space-y-4">
            {paginatedRequests.map((cr) => (
              <Card
                key={cr.id}
                padding="none"
                className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="soft">{cr.request_type.replace(/_/g, ' ')}</Badge>
                      <Badge variant="soft">{cr.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      Org: {cr.org_id.slice(0, 8)}… · Request: {cr.id.slice(0, 8)}…
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(cr.created_at).toLocaleString()}
                    </p>
                  </div>
                  <ChangeRequestReviewActions request={cr} />
                </div>
                <div className="p-4">
                  <PayloadParameterCard cr={cr} />
                </div>
              </Card>
            ))}
          </div>
        )}

        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            setCurrentPage={(page) => setParam('page', page)}
            onPageSizeChange={(size) => setParams({ limit: size, page: 1 })}
            pageSizeOptions={[5, 10, 20]}
          />
        )}
      </AdminQueryState>
    </div>
  )
}
