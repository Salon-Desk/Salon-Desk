'use client'

import { CreditCard, Percent, Plus, Receipt, RefreshCw, Sparkles } from 'lucide-react'
import React, { useMemo, useState } from 'react'

import { StatCard } from '@/components/card'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { EmptyState } from '@/components/ui'
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
  const entryCount = dashboard?.ledger_entry_count || 0

  const pctRules = useMemo(
    () => commissions.filter((c) => c.type === 'percentage').length,
    [commissions],
  )
  const flatHybridRules = useMemo(
    () => commissions.filter((c) => c.type === 'flat' || c.type === 'hybrid').length,
    [commissions],
  )

  const columns = useMemo(() => getCommissionTableColumns({ categoryNameById }), [categoryNameById])

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
              <span>Platform Take-Rate · PayPal Settlement Split</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-extrabold text-slate-900 text-2xl tracking-tight sm:text-3xl">
                Take-Rate Rules &amp; Commission Matrix
              </h1>
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-2xs">
                {totalItems} {totalItems === 1 ? 'Rule' : 'Rules'}
              </span>
            </div>

            <p className="max-w-2xl text-xs text-slate-600 sm:text-sm leading-relaxed">
              Configure platform commission percentages and flat fees by service category. Automated
              revenue splits trigger when bookings settle via PayPal Orders v2.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-xs backdrop-blur-sm">
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-700 text-xs shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.92]"
              title="Refresh rules from ledger"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Sync</span>
            </button>

            <PrimaryButton
              title="Add Commission Rule"
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
          label="Total Rules"
          value={totalItems}
          icon={Percent}
          tone="amber"
          footnote="Active category rules"
          className="hover:border-amber-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Revenue Share"
          value={pctRules}
          icon={CreditCard}
          tone="emerald"
          footnote="Percentage take-rates"
          className="hover:border-emerald-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Fixed / Hybrid"
          value={flatHybridRules}
          icon={Sparkles}
          tone="sky"
          footnote="Flat fee & tiered models"
          className="hover:border-sky-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Settled Volume"
          value={formatUsd(ledgerSum)}
          icon={Receipt}
          tone="purple"
          footnote={`${entryCount} ledger entries recorded`}
          className="hover:border-purple-200 hover:shadow-xs transition-all"
        />
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
                className="h-9 rounded-xl px-5 text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
                onClick={() => {
                  setEditing(null)
                  setIsOpen(true)
                }}
              />
            }
          />
        ) : null}

        {commissions.length > 0 ? (
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
            showSearch={true}
            searchPlaceholder="Search rules by category, name, or fee type…"
            initialSearchValue={displayParams.search}
            onSearch={(val) => setParams({ search: val, page: 1 })}
            showItemsPerPage={true}
            showColumnSelector={true}
            showActions={true}
            onEdit={(c) => {
              setEditing(c)
              setIsOpen(true)
            }}
            refetch={() => void refetch()}
            isFetching={isLoading}
            customButtons={[
              <PrimaryButton
                key="add-rule"
                title="Add Commission Rule"
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
