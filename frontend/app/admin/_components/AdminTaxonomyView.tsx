'use client'

import { CheckCircle2, Layers, Plus, RefreshCw, Sparkles, Tags } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { StatCard } from '@/components/card'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { Card, EmptyState, SearchInput } from '@/components/ui'
import PrimaryButton from '@/components/ui/primary-button'
import { AdminQueryState } from '@/components/ui/query-state-view'
import { toastColor } from '@/constant/toast-color'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useListingParams } from '@/hooks/useListingParams'
import {
  type AdminTaxonomyListParams,
  AdminTaxonomyListParamsSchema,
} from '@/lib/listing-params/admin-taxonomy-list-params'
import { useGetAdminCategoriesQuery } from '@/store/api/platformApi'
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

  const categories = categoriesData?.items ?? []
  const totalItems = categoriesData?.total ?? categories.length
  const currentPage = displayParams.page
  const pageSize = displayParams.limit
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const settledSearch = typeof displayParams.search === 'string' ? displayParams.search : ''

  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<ApiServiceCategory | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyId = (id: string) => {
    void navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success('Category UUID copied to clipboard', toastColor.success)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const columns = useMemo(
    () =>
      getTaxonomyTableColumns({
        copiedId,
        onCopyId: handleCopyId,
        onEdit: (cat) => {
          setEditing(cat)
          setIsOpen(true)
        },
      }),
    [copiedId],
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-12 animate-in fade-in duration-300 sm:space-y-6">
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
              <span>Platform Taxonomy · Universal Catalog Index</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-extrabold text-slate-900 text-2xl tracking-tight sm:text-3xl">
                Service Taxonomy &amp; Categories
              </h1>
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-2xs">
                {totalItems} {totalItems === 1 ? 'Category' : 'Categories'}
              </span>
            </div>

            <p className="max-w-2xl text-xs text-slate-600 sm:text-sm leading-relaxed">
              Manage standardized salon service categories used across the platform for service
              catalog discovery, client booking menus, and automated commission take-rate mapping.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-xs backdrop-blur-sm">
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-700 text-xs shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.92]"
              title="Refresh categories"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Sync</span>
            </button>

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
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          label="Total Categories"
          value={totalItems}
          icon={Layers}
          tone="amber"
          footnote="Service classifications"
          className="hover:border-amber-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Active Catalog"
          value={totalItems}
          icon={Sparkles}
          tone="emerald"
          footnote="Universal booking tags"
          className="hover:border-emerald-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Taxonomy State"
          value="Standardized"
          icon={CheckCircle2}
          tone="purple"
          footnote="Multi-tenant salon mapping"
          className="hover:border-purple-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Commission Ready"
          value="Universal"
          icon={Tags}
          tone="sky"
          footnote="Rule-compatible categories"
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
          <Card
            padding="none"
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <div className="flex flex-col justify-between gap-3 border-slate-100 border-b p-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Standardized Service Classifications
                </h2>
                <p className="text-slate-500 text-xs">
                  Universal service categories available across all merchant salons
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SearchInput
                  value={displayParams.search}
                  onChange={(val) => setParams({ search: val, page: 1 })}
                  placeholder="Search categories…"
                  className="w-48 text-xs sm:w-60"
                />
                <span className="shrink-0 rounded-lg border border-slate-200/70 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600">
                  {totalItems} categories
                </span>
              </div>
            </div>

            {settledSearch.trim() && (
              <div className="flex items-center justify-between border-b border-amber-200/60 bg-amber-50/50 px-4 py-2 text-xs text-amber-900">
                <span>
                  Filtering by: &ldquo;<strong>{settledSearch}</strong>&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => setParams({ search: '', page: 1 })}
                  className="cursor-pointer font-bold text-amber-800 hover:text-amber-950 hover:underline active:scale-[0.98]"
                >
                  Clear search
                </button>
              </div>
            )}

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
              showSearch={false}
              showItemsPerPage={true}
              tableClassName="border-slate-200/80"
              headerClassName="bg-slate-50/70"
            />
          </Card>
        ) : null}
      </AdminQueryState>

      <CategoryFormModal
        open={isOpen}
        editing={editing}
        onClose={() => {
          setIsOpen(false)
          setEditing(null)
          void refetch()
        }}
      />
    </div>
  )
}
