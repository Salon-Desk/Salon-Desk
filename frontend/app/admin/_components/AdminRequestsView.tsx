'use client'

import { Clock, Sliders } from 'lucide-react'
import { useMemo } from 'react'

import { Badge, Card, EmptyState, SearchInput } from '@/components/ui'
import { Pagination } from '@/components/ui/pagination'
import { AdminQueryState } from '@/components/ui/query-state-view'
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
    <div className="mx-auto w-full max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-extrabold text-xl text-slate-900 tracking-tight sm:text-2xl">
          Change Request Governance
        </h1>
        <p className="text-xs text-slate-500">
          Review, approve, and audit merchant policy amendments and PayPal payout configuration
          changes.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
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
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all cursor-pointer active:scale-[0.98] ${
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
