'use client'

import { CreditCard, Percent, Plus, Receipt, Sparkles } from 'lucide-react'
import React, { useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/button'
import { StatCard } from '@/components/card'
import { EmptyState } from '@/components/empty'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { PageHeader } from '@/components/ui'
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
      <PageHeader
        eyebrow="Platform Take-Rate · PayPal Settlement Split"
        title="Take-Rate Rules & Commission Matrix"
        badge={`${totalItems} ${totalItems === 1 ? 'Rule' : 'Rules'}`}
        description="Configure platform commission percentages and flat fees by service category. Automated revenue splits trigger when bookings settle via PayPal Orders v2."
        onRefresh={() => void refetch()}
        refreshTitle="Refresh rules from ledger"
        actions={
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
        }
      />

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
