'use client'

import { Building2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Pagination } from '@/components/table/Pagination'
import { EmptyState } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useDebounce } from '@/hooks/use-debounce'
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
import type { SalonCounts, StatusFilter } from './_types'

export default function AdminSalonsPage() {
  const { skipAdminApi } = useAdminSession()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 350)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [actioningOrgId, setActioningOrgId] = useState<string | null>(null)

  // Reset pagination on filter or search updates
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, debouncedSearch])

  // System-wide dashboard statistics
  const { data: dashboardData, refetch: refetchDashboard } = useGetAdminDashboardQuery(undefined, {
    skip: skipAdminApi,
  })

  // Paginated query with search & status filters
  const queryParams = useMemo(() => {
    const params: { page: number; page_size: number; status?: string; q?: string } = {
      page: currentPage,
      page_size: pageSize,
    }
    if (filter !== 'all') {
      params.status = filter
    }
    if (debouncedSearch.trim()) {
      params.q = debouncedSearch.trim()
    }
    return params
  }, [currentPage, pageSize, filter, debouncedSearch])

  const {
    data: organizationsData,
    isLoading,
    isFetching,
    isError,
    refetch: refetchOrganizations,
  } = useGetAdminOrganizationsQuery(queryParams, { skip: skipAdminApi })

  const [approveOrg, { isLoading: approving }] = useApproveOrganizationMutation()
  const [suspendOrg, { isLoading: suspending }] = useSuspendOrganizationMutation()

  const organizations = organizationsData?.items ?? []
  const totalItems = organizationsData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // True system counts from dashboard
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
    setFilter('all')
    setSearchQuery('')
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <SalonHeader totalSalons={counts.all} isFetching={isFetching} onRefresh={handleRefresh} />

      {/* KPI Metric Cards */}
      <SalonKpiGrid counts={counts} activeFilter={filter} onSelectFilter={setFilter} />

      {/* Filter Tabs, Search & Active Filter Strip */}
      <SalonFilterBar
        filter={filter}
        counts={counts}
        searchQuery={searchQuery}
        debouncedSearch={debouncedSearch}
        totalMatching={totalItems}
        onFilterChange={setFilter}
        onSearchChange={setSearchQuery}
        onResetFilters={handleResetFilters}
      />

      {/* Salons List */}
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
                setCurrentPage={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setCurrentPage(1)
                }}
                pageSizeOptions={[10, 20, 50]}
              />
            </div>
          )}

          {organizations.length === 0 && !isLoading && (
            <EmptyState
              icon={Building2}
              title="No partner salons found"
              description={
                debouncedSearch
                  ? `No salons matching "${debouncedSearch}". Clear your search query or switch filters.`
                  : filter !== 'all'
                    ? `No salons found in "${filter}" status. Try selecting another filter.`
                    : 'No partner salons have been registered on the platform yet.'
              }
              action={
                filter !== 'all' || debouncedSearch ? (
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
