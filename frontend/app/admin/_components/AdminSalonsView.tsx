'use client'

import { Building2, LayoutGrid, List, PauseCircle, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import { EmptyState } from '@/components/empty'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { SegmentedControl } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { AdminQueryState } from '@/components/ui/query-state-view'
import { toastColor } from '@/constant/toast-color'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useAgentUiActions } from '@/hooks/useAgentUiActions'
import { useListingParams } from '@/hooks/useListingParams'
import {
  adminSalonsListDefaults,
  type AdminSalonsListParams,
  AdminSalonsListParamsSchema,
} from '@/lib/listing-params/admin-salons-list-params'
import {
  useApproveOrganizationMutation,
  useGetAdminDashboardQuery,
  useGetAdminOrganizationsQuery,
  useSuspendOrganizationMutation,
} from '@/store/api/platformApi'
import type { ApiOrganization } from '@/types/api-org'
import type { SalonCounts } from '@/types/organization'

import { SalonCard } from './SalonCard'
import { SalonDetailsModal } from './SalonDetailsModal'
import { SalonFilterBar } from './SalonFilterBar'
import { SalonHeader } from './SalonHeader'
import { SalonKpiGrid } from './SalonKpiGrid'
import { SalonStatusConfirmDialog } from './SalonStatusConfirmDialog'
import { getSalonTableColumns } from './SalonTableColumns'

export function AdminSalonsView() {
  const { skipAdminApi } = useAdminSession()
  const { params, displayParams, setParam, setParams } = useListingParams<
    AdminSalonsListParams,
    typeof AdminSalonsListParamsSchema
  >(AdminSalonsListParamsSchema)

  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [actioningOrgId, setActioningOrgId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [selectedOrg, setSelectedOrg] = useState<ApiOrganization | null>(null)
  const [statusActionTarget, setStatusActionTarget] = useState<{
    org: ApiOrganization
    action: 'approve' | 'suspend'
  } | null>(null)

  useAgentUiActions({
    onAction: (payload) => {
      if (payload.action === 'filter_pending') {
        setParams({ status: 'pending', page: 1 })
      } else if (payload.action === 'filter_approved') {
        setParams({ status: 'approved', page: 1 })
      }
    },
  })

  const { data: dashboardData, refetch: refetchDashboard } = useGetAdminDashboardQuery(undefined, {
    skip: skipAdminApi,
  })

  const {
    data: organizationsData,
    isLoading,
    isFetching,
    isError,
    refetch: refetchOrganizations,
  } = useGetAdminOrganizationsQuery(params, { skip: skipAdminApi })

  const [approveOrg, { isLoading: approving }] = useApproveOrganizationMutation()
  const [suspendOrg, { isLoading: suspending }] = useSuspendOrganizationMutation()

  const organizations = organizationsData?.items ?? []
  const totalItems = organizationsData?.total ?? 0
  const pageSize = displayParams.limit
  const currentPage = displayParams.page
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const settledSearch = typeof params.q === 'string' ? params.q : ''

  const counts: SalonCounts = useMemo(
    () => ({
      all: dashboardData?.total_organizations ?? totalItems,
      pending: dashboardData?.pending_organizations ?? 0,
      approved: dashboardData?.approved_organizations ?? 0,
      suspended: dashboardData?.suspended_organizations ?? 0,
    }),
    [dashboardData, totalItems],
  )

  const handleRefresh = () => {
    void refetchOrganizations()
    void refetchDashboard()
    toast.success('Directory updated', toastColor.info)
  }

  const handleCopy = (text: string, label: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(text)
    toast.success(`${label} copied to clipboard`, toastColor.success)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const requestApprove = (org: ApiOrganization) => {
    setStatusActionTarget({ org, action: 'approve' })
  }

  const requestSuspend = (org: ApiOrganization) => {
    setStatusActionTarget({ org, action: 'suspend' })
  }

  const handleConfirmStatusChange = async () => {
    if (!statusActionTarget) return
    const { org, action } = statusActionTarget
    try {
      setActioningOrgId(org.id)
      if (action === 'approve') {
        await approveOrg(org.id).unwrap()
        toast.success(`${org.name} successfully activated`, toastColor.success)
      } else {
        await suspendOrg(org.id).unwrap()
        toast.success(`${org.name} suspended`, toastColor.success)
      }
      setStatusActionTarget(null)
      void refetchOrganizations()
      void refetchDashboard()
    } catch (err) {
      toast.error(
        String(
          (err as { data?: { detail?: string } })?.data?.detail ||
            `${action === 'approve' ? 'Activation' : 'Suspension'} failed`,
        ),
        toastColor.error,
      )
    } finally {
      setActioningOrgId(null)
    }
  }

  const handleResetFilters = () => {
    setParams(adminSalonsListDefaults)
  }

  const salonColumns = useMemo(
    () =>
      getSalonTableColumns({
        onCopy: handleCopy,
        copiedKey,
      }),
    [copiedKey],
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SalonHeader totalSalons={counts.all} isFetching={isFetching} onRefresh={handleRefresh} />
        <SegmentedControl
          options={[
            { value: 'table' as const, label: 'Table', icon: List },
            { value: 'cards' as const, label: 'Cards', icon: LayoutGrid },
          ]}
          value={viewMode}
          onChange={(val) => setViewMode(val)}
        />
      </div>

      <SalonKpiGrid
        counts={counts}
        activeFilter={displayParams.status}
        onSelectFilter={(status) => setParams({ status, page: 1 })}
      />

      <SalonFilterBar
        filter={displayParams.status}
        counts={counts}
        searchQuery={displayParams.search}
        debouncedSearch={settledSearch}
        totalMatching={totalItems}
        showSearch={viewMode === 'cards'}
        onFilterChange={(status) => setParams({ status, page: 1 })}
        onSearchChange={(search) => setParams({ search, page: 1 })}
        onResetFilters={handleResetFilters}
      />

      <AdminQueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetchOrganizations()}
        loadingLabel="Loading salons directory…"
        errorLabel="Could not load organizations."
      >
        {viewMode === 'table' ? (
          <BasicDataGridTable
            data={organizations}
            columns={salonColumns}
            isLoading={isLoading}
            isFetching={isFetching}
            refetch={() => void refetchOrganizations()}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={pageSize}
            onPageChange={(page) => setParam('page', page)}
            onItemPerPageChange={(size) => setParams({ limit: size, page: 1 })}
            showPagination={totalItems > 0}
            showSearch={true}
            searchPlaceholder="Search salon name, description, UUID…"
            initialSearchValue={displayParams.search}
            onSearch={(search) => setParams({ search, page: 1 })}
            showItemsPerPage={true}
            showColumnSelector={true}
            showActions={true}
            onView={(org) => setSelectedOrg(org)}
            renderRowActions={(org) => {
              const isActioning = actioningOrgId === org.id
              const isApproved = org.status === 'approved'

              return !isApproved ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-all duration-200 cursor-pointer"
                  disabled={isActioning && approving}
                  onClick={() => requestApprove(org)}
                  title="Activate salon"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="sr-only">Activate</span>
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-all duration-200 cursor-pointer"
                  disabled={isActioning && suspending}
                  onClick={() => requestSuspend(org)}
                  title="Suspend salon"
                >
                  <PauseCircle className="h-3.5 w-3.5" />
                  <span className="sr-only">Suspend</span>
                </Button>
              )
            }}
            tableClassName="border-slate-200/80"
            headerClassName="bg-slate-50/70"
          />
        ) : (
          <div className="space-y-3.5">
            {organizations.map((org) => (
              <SalonCard
                key={org.id}
                org={org}
                isActioning={actioningOrgId === org.id}
                approving={approving}
                suspending={suspending}
                copiedKey={copiedKey}
                onApprove={requestApprove}
                onSuspend={requestSuspend}
                onViewDetail={(item) => setSelectedOrg(item)}
                onCopy={handleCopy}
              />
            ))}

            {totalItems > 0 && (
              <div className="pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  setCurrentPage={(page) => setParam('page', page)}
                  onPageSizeChange={(size) => setParams({ limit: size, page: 1 })}
                  pageSizeOptions={[10, 20, 50]}
                />
              </div>
            )}
          </div>
        )}

        {organizations.length === 0 && !isLoading && (
          <EmptyState
            icon={Building2}
            title="No partner salons found"
            description={
              settledSearch
                ? `No salons matching "${settledSearch}". Clear your search query or switch filters.`
                : displayParams.status !== 'all'
                  ? `No salons found in "${displayParams.status}" status. Try selecting another filter.`
                  : 'No partner salons have been registered on the platform yet.'
            }
            action={
              displayParams.status !== 'all' || settledSearch ? (
                <PrimaryButton
                  title="Clear search and filters"
                  size="sm"
                  fullWidth={false}
                  className="h-9 rounded-xl px-4 text-xs font-semibold"
                  onClick={handleResetFilters}
                />
              ) : null
            }
          />
        )}
      </AdminQueryState>

      <SalonDetailsModal
        org={selectedOrg}
        open={Boolean(selectedOrg)}
        onClose={() => setSelectedOrg(null)}
        onApprove={(org) => requestApprove(org)}
        onSuspend={(org) => requestSuspend(org)}
        onCopy={handleCopy}
        copiedKey={copiedKey}
        approving={approving}
        suspending={suspending}
      />

      <SalonStatusConfirmDialog
        open={Boolean(statusActionTarget)}
        onClose={() => setStatusActionTarget(null)}
        onConfirm={() => void handleConfirmStatusChange()}
        salonName={statusActionTarget?.org.name ?? ''}
        targetAction={statusActionTarget?.action ?? 'approve'}
        isLoading={actioningOrgId === statusActionTarget?.org.id && (approving || suspending)}
      />
    </div>
  )
}
