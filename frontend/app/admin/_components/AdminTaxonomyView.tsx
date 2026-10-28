'use client'

import { CheckCircle2, Layers, Plus, Sparkles, Tags } from 'lucide-react'
import React, { useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/button'
import { StatCard } from '@/components/card'
import { EmptyState } from '@/components/empty'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { PageHeader } from '@/components/ui'
import { AdminQueryState } from '@/components/ui/query-state-view'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useListingParams } from '@/hooks/useListingParams'
import {
  type AdminTaxonomyListParams,
  AdminTaxonomyListParamsSchema,
} from '@/lib/listing-params/admin-taxonomy-list-params'
import {
  useGetAdminCategoriesQuery,
  useGetAdminTaxonomyMetricsQuery,
} from '@/store/api/platformApi'
import type { ApiServiceCategory } from '@/types/api-org'

import { CategoryFormModal } from './CategoryFormModal'
import { getTaxonomyTableColumns } from './TaxonomyTableColumns'

export function AdminTaxonomyView() {
  const { skipAdminApi } = useAdminSession()
  const { params, displayParams, setParam, setParams } = useListingParams<
    AdminTaxonomyListParams,
    typeof AdminTaxonomyListParamsSchema
  >(AdminTaxonomyListParamsSchema)

  const {
    data: categoriesData,
    isLoading,
    isError,
    refetch,
  } = useGetAdminCategoriesQuery(params, { skip: skipAdminApi })

  const { data: metricsData, refetch: refetchMetrics } = useGetAdminTaxonomyMetricsQuery(
    undefined,
    { skip: skipAdminApi },
  )

  const categories = categoriesData?.items ?? []
  const totalItems = categoriesData?.total ?? categories.length
  const currentPage = displayParams.page
  const pageSize = displayParams.limit
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<ApiServiceCategory | null>(null)
  const columns = useMemo(() => getTaxonomyTableColumns(), [])

  const activeCategoriesCount = useMemo(() => {
    return categories.filter((c) => (c.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE').length
  }, [categories])

  const totalActiveSalons = useMemo(() => {
    if (metricsData?.total_active_organizations !== undefined) {
      return metricsData.total_active_organizations
    }
    return categories.reduce((sum, c) => sum + (c.active_organizations_count ?? 0), 0)
  }, [metricsData, categories])

  const totalActiveServices = useMemo(() => {
    if (metricsData?.total_active_services !== undefined) {
      return metricsData.total_active_services
    }
    return categories.reduce((sum, c) => sum + (c.active_services_count ?? 0), 0)
  }, [metricsData, categories])

  const handleRefresh = () => {
    void refetch()
    void refetchMetrics()
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-12 animate-in fade-in duration-300 sm:space-y-6">
      {/* Header Banner */}
      <PageHeader
        eyebrow="Platform Taxonomy · Universal Catalog Index"
        title="Service Taxonomy & Categories"
        badge={`${totalItems} ${totalItems === 1 ? 'Category' : 'Categories'}`}
        description="Manage standardized salon service categories used across the platform for service catalog discovery, client booking menus, and automated commission take-rate mapping."
        onRefresh={handleRefresh}
        refreshTitle="Refresh categories"
        actions={
          <PrimaryButton
            title="Add Category"
            size="sm"
            fullWidth={false}
            icon={<Plus className="h-3.5 w-3.5" />}
            className="h-10 rounded-xl px-4.5 text-xs font-bold shadow-xs transition-all hover:shadow-md active:scale-[0.98]"
            onClick={() => {
              setEditing(null)
              setIsOpen(true)
            }}
          />
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          label="Total Categories"
          value={metricsData?.total_categories ?? totalItems}
          icon={Layers}
          tone="amber"
          footnote="Service classifications"
          className="hover:border-amber-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Active Catalog"
          value={metricsData?.active_categories ?? activeCategoriesCount}
          icon={Sparkles}
          tone="emerald"
          footnote="Universal booking tags"
          className="hover:border-emerald-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Active Salons"
          value={totalActiveSalons}
          icon={CheckCircle2}
          tone="purple"
          footnote="Organizations using categories"
          className="hover:border-purple-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Active Services"
          value={totalActiveServices}
          icon={Tags}
          tone="sky"
          footnote="Live platform services"
          className="hover:border-sky-200 hover:shadow-xs transition-all"
        />
      </div>

      <AdminQueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loadingLabel="Loading categories…"
        errorLabel="Could not load categories."
      >
        {!isLoading && !isError && categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No service categories yet"
            description="Create categories like Hair Styling, Coloring, Spa, or Treatments to classify salon service menus."
            action={
              <PrimaryButton
                title="Create category"
                size="sm"
                fullWidth={false}
                icon={<Plus className="h-3.5 w-3.5" />}
                className="h-9 rounded-xl px-5 text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
                onClick={() => {
                  setEditing(null)
                  setIsOpen(true)
                }}
              />
            }
          />
        ) : null}

        {categories.length > 0 ? (
          <BasicDataGridTable
            data={categories}
            columns={columns}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={pageSize}
            onPageChange={(page: number) => setParam('page', page)}
            onItemPerPageChange={(size: number) => setParams({ limit: size, page: 1 })}
            showPagination={totalItems > 0}
            showSearch={true}
            searchPlaceholder="Search categories by name, code, or description…"
            initialSearchValue={displayParams.search}
            onSearch={(val) => setParams({ search: val, page: 1 })}
            showItemsPerPage={true}
            showColumnSelector={true}
            showActions={true}
            onEdit={(cat) => {
              setEditing(cat)
              setIsOpen(true)
            }}
            refetch={() => void refetch()}
            isFetching={isLoading}
            customButtons={[
              <PrimaryButton
                key="add-category"
                title="Add Category"
                size="sm"
                fullWidth={false}
                icon={<Plus className="h-3.5 w-3.5" />}
                className="h-9 rounded-xl px-4 text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
                onClick={() => {
                  setEditing(null)
                  setIsOpen(true)
                }}
              />,
            ]}
            tableClassName="border-slate-200/80"
            headerClassName="bg-slate-50/70"
          />
        ) : null}
      </AdminQueryState>

      <CategoryFormModal
        open={isOpen}
        editing={editing}
        onClose={() => {
          setIsOpen(false)
          setEditing(null)
          void refetch()
          void refetchMetrics()
        }}
      />
    </div>
  )
}
