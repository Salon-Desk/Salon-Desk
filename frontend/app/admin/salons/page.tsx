'use client'

import { Building2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Pagination } from '@/components/table/Pagination'
import { EmptyState } from '@/components/ui'
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

import { AdminQueryState } from '../_components/admin-query-state'
import { SalonCard } from './_components/salon-card'
import { SalonFilterBar } from './_components/salon-filter-bar'
import { SalonHeader } from './_components/salon-header'
import { SalonKpiGrid } from './_components/salon-kpi-grid'
import type { SalonCounts } from './_types'

export default function AdminSalonsPage() {
  const { skipAdminApi } = useAdminSession()
  const { params, displayParams, setParam, setParams } = useListingParams<
    AdminSalonsListParams,
    typeof AdminSalonsListParamsSchema
  >(AdminSalonsListParamsSchema)

  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [actioningOrgId, setActioningOrgId] = useState<string | null>(null)

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

  const handleApprove = async (org: ApiOrganization) => {
    try {
      setActioningOrgId(org.id)
      await approveOrg(org.id).unwrap()
      toast.success(`${org.name} successfully approved`, toastColor.success)
      void refetchOrganizations()
      void refetchDashboard()
    } catch (err) {
      toast.error(
        String((err as { data?: { detail?: string } })?.data?.detail || 'Approval failed'),
        toastColor.error,
      )
    } finally {
      setActioningOrgId(null)
    }
  }

  const handleSuspend = async (org: ApiOrganization) => {
    try {
      setActioningOrgId(org.id)
      await suspendOrg(org.id).unwrap()
      toast.success(`${org.name} suspended`, toastColor.success)
      void refetchOrganizations()
      void refetchDashboard()
    } catch (err) {
      toast.error(
        String((err as { data?: { detail?: string } })?.data?.detail || 'Suspension failed'),
        toastColor.error,
      )
    } finally {
      setActioningOrgId(null)
    }
  }

  const handleResetFilters = () => {
    setParams(adminSalonsListDefaults)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      <SalonHeader totalSalons={counts.all} isFetching={isFetching} onRefresh={handleRefresh} />

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
        onFilterChange={(status) => setParams({ status, page: 1 })}
        onSearchChange={(search) => setParam('search', search)}
        onResetFilters={handleResetFilters}
      />

      <AdminQueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetchOrganizations()}
        loadingLabel="Loading salons directory…"
        errorLabel="Could not load organizations."
      >
        <div className="space-y-3.5">
          {organizations.map((org) => (
            <SalonCard
              key={org.id}
              org={org}
              isActioning={actioningOrgId === org.id}
              approving={approving}
              suspending={suspending}
              copiedKey={copiedKey}
              onApprove={handleApprove}
              onSuspend={handleSuspend}
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
        </div>
      </AdminQueryState>
    </div>
  )
}
