'use client'

import { Plus, Tags } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

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
    <div className="mx-auto w-full max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Service Taxonomy &amp; Categories
          </h1>
          <p className="text-slate-500 text-xs">
            {isLoading
              ? 'Loading…'
              : `${totalItems} platform taxonomy categories for service classification`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput
            value={displayParams.search}
            onChange={(val) => setParams({ search: val, page: 1 })}
            placeholder="Search categories…"
            className="w-48 text-xs sm:w-64"
          />
          <PrimaryButton
            title="Add category"
            size="sm"
            fullWidth={false}
            icon={<Plus className="h-4 w-4" />}
            className="h-9 rounded-lg px-3.5 font-semibold text-xs shadow-xs"
            onClick={() => {
              setEditing(null)
              setIsOpen(true)
            }}
          />
        </div>
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
                className="h-8.5 rounded-lg px-4 text-xs"
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
            className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
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
