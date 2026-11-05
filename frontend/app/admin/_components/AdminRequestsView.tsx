'use client'

import { CheckCircle2, Clock, LayoutGrid, List, Sliders, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { StatCard } from '@/components/card'
import { EmptyState } from '@/components/empty'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { Badge, Card, PageHeader, SearchInput, SegmentedControl } from '@/components/ui'
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
import type { ApiChangeRequest } from '@/types/api-org'

import { ChangeRequestDetailsModal } from './ChangeRequestDetailsModal'
import { ChangeRequestReviewActions } from './ChangeRequestReviewActions'
import { getChangeRequestsTableColumns } from './ChangeRequestsTableColumns'
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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [inspectedRequest, setInspectedRequest] = useState<ApiChangeRequest | null>(null)

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

  const tableColumns = useMemo(
    () =>
      getChangeRequestsTableColumns({
        onInspect: (req) => setInspectedRequest(req),
      }),
    [],
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner with View Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow="Merchant Governance · Policy & Payout Amendments"
          title="Change Request Governance"
          badge={`${counts.PENDING} Actionable`}
          description="Review, approve, and audit salon merchant policy updates (free cancellation windows, no-show penalties) and PayPal payout configuration changes."
          onRefresh={() => void handleRefresh()}
          isRefreshing={isRefreshing}
          refreshTitle="Refresh requests"
        />

        <div className="shrink-0 self-start sm:self-center">
          <SegmentedControl
            options={[
              { value: 'table' as const, label: 'Table', icon: List },
              { value: 'cards' as const, label: 'Cards', icon: LayoutGrid },
            ]}
            value={viewMode}
            onChange={(val) => setViewMode(val)}
          />
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
        ) : viewMode === 'table' ? (
          /* Table View */
          <BasicDataGridTable
            data={paginatedRequests}
            columns={tableColumns}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={pageSize}
            onPageChange={(page) => setParam('page', page)}
            onItemPerPageChange={(size) => setParams({ limit: size, page: 1 })}
            showPagination={totalItems > 0}
            showSearch={false}
            showItemsPerPage={true}
            showColumnSelector={true}
            showActions={false}
            refetch={() => void handleRefresh()}
            isFetching={isLoading || isRefreshing}
            tableClassName="border-slate-200/80"
            headerClassName="bg-slate-50/70"
          />
        ) : (
          /* Cards View */
          <div className="space-y-4">
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
                    <ChangeRequestReviewActions request={cr} onReviewed={() => void refetch()} />
                  </div>
                  <div className="p-4">
                    <PayloadParameterCard cr={cr} />
                  </div>
                </Card>
              ))}
            </div>

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
          </div>
        )}
      </AdminQueryState>

      {/* Inspect & Review Modal */}
      <ChangeRequestDetailsModal
        request={inspectedRequest}
        open={Boolean(inspectedRequest)}
        onClose={() => setInspectedRequest(null)}
        onSuccess={() => void refetch()}
      />
    </div>
  )
}
