'use client'

import { Percent, Plus, RefreshCw } from 'lucide-react'
import React, { useMemo, useState } from 'react'

import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { Card, EmptyState, SearchInput } from '@/components/ui'
import PrimaryButton from '@/components/ui/primary-button'
import { AdminQueryState } from '@/components/ui/query-state-view'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useListingParams } from '@/hooks/useListingParams'
import { formatUsd } from '@/lib/format'
import {
  type AdminCommissionListParams,
  AdminCommissionListParamsSchema,
} from '@/lib/listing-params/admin-commission-list-params'
import { buildAdminCategoriesNavApiParams } from '@/lib/listing-params/admin-taxonomy-list-params'
import {
  useGetAdminCategoriesQuery,
  useGetAdminCommissionsQuery,
  useGetAdminDashboardQuery,
} from '@/store/api/platformApi'
import type { PlatformCommission } from '@/types/api-org'

import { CommissionFormModal } from './CommissionFormModal'
import { getCommissionTableColumns } from './CommissionTableColumns'

export function AdminCommissionView() {
  const { skipAdminApi } = useAdminSession()
  const { params, displayParams, setParam, setParams } = useListingParams<
    AdminCommissionListParams,
    typeof AdminCommissionListParamsSchema
  >(AdminCommissionListParamsSchema)

  const {
    data: commissionsData,
    isLoading,
    isError,
    refetch,
  } = useGetAdminCommissionsQuery(params, { skip: skipAdminApi })
  const { data: categoriesData } = useGetAdminCategoriesQuery(buildAdminCategoriesNavApiParams(), {
    skip: skipAdminApi,
  })
  const commissions = commissionsData?.items ?? []
  const totalItems = commissionsData?.total ?? commissions.length
  const categories = categoriesData?.items ?? []
  const { data: dashboard } = useGetAdminDashboardQuery(undefined, { skip: skipAdminApi })

  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<PlatformCommission | null>(null)

  const currentPage = displayParams.page
  const pageSize = displayParams.limit

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((c) => map.set(c.id, c.name))
    return map
  }, [categories])

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const ledgerSum = Number(dashboard?.ledger_amount_sum || 0)

  const columns = useMemo(
    () =>
      getCommissionTableColumns({
        categoryNameById,
        onEdit: (c) => {
          setEditing(c)
          setIsOpen(true)
        },
      }),
    [categoryNameById],
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Take-Rate Rules
          </h1>
          <p className="text-slate-500 text-xs">
            Configure platform commission rates by service category. SaaS invoices live under
            Billing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="font-mono text-[10px] text-slate-400 uppercase">Ledger volume:</span>
            <span className="font-bold text-emerald-800 text-xs">{formatUsd(ledgerSum)}</span>
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-2 font-semibold text-slate-700 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:bg-slate-50 hover:text-slate-900"
            title="Refresh rules"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Sync</span>
          </button>

          <PrimaryButton
            title="Add Commission Rule"
            size="sm"
            fullWidth={false}
            icon={<Plus className="h-3.5 w-3.5" />}
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
        loadingLabel="Loading commissions…"
        errorLabel="Could not load commissions."
      >
        {!isLoading && !isError && commissions.length === 0 ? (
          <EmptyState
            icon={Percent}
            title="No commission rules configured"
            description="Create your first platform take-rate rule to automatically split captured revenue upon appointment settlement."
            action={
              <PrimaryButton
                title="Create first rule"
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

        {commissions.length > 0 ? (
          <Card
            padding="none"
            className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <div className="flex flex-col justify-between gap-3 border-slate-100 border-b p-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Categorization Take-Rate Matrix
                </h2>
                <p className="text-slate-500 text-xs">
                  Automated settlement split applied when bookings are captured via PayPal Orders v2
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SearchInput
                  value={displayParams.search}
                  onChange={(val) => setParams({ search: val, page: 1 })}
                  placeholder="Search rules…"
                  className="w-48 text-xs"
                />
                <span className="shrink-0 rounded-md border border-slate-200/70 bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-500">
                  {totalItems} rules
                </span>
              </div>
            </div>

            <BasicDataGridTable
              data={commissions}
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

      <CommissionFormModal
        open={isOpen}
        editing={editing}
        categories={categories}
        onClose={() => {
          setIsOpen(false)
          setEditing(null)
          void refetch()
        }}
      />
    </div>
  )
}
