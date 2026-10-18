'use client'

import { Clock, CreditCard, Edit2, Percent, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Badge, Card, EmptyState, IconButton, SearchInput, TablePagination } from '@/components/ui'
import { useAdminSession } from '@/hooks/use-admin-session'
import { formatUsd } from '@/lib/format'
import {
  useGetAdminCategoriesQuery,
  useGetAdminCommissionsQuery,
  useGetAdminDashboardQuery,
} from '@/store/api/platformApi'
import type { PlatformCommission } from '@/types/api-org'

import { AdminQueryState } from '../_components/admin-query-state'
import { CommissionFormModal } from '../_components/commission-form-modal'

function formatCommissionRate(c: PlatformCommission): string {
  const pct = c.percentage != null ? `${Number(c.percentage)}%` : null
  const flat = c.flat != null ? formatUsd(Number(c.flat)) : null
  if (c.type === 'hybrid') return [pct, flat].filter(Boolean).join(' + ')
  if (c.type === 'flat') return flat || '—'
  return pct || '—'
}

export default function AdminCommissionPage() {
  const { skipAdminApi } = useAdminSession()
  const {
    data: commissionsData,
    isLoading,
    isError,
    refetch,
  } = useGetAdminCommissionsQuery(undefined, { skip: skipAdminApi })
  const { data: categoriesData } = useGetAdminCategoriesQuery(undefined, { skip: skipAdminApi })
  const commissions = commissionsData?.items ?? []
  const categories = categoriesData?.items ?? []
  const { data: dashboard } = useGetAdminDashboardQuery(undefined, { skip: skipAdminApi })

  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<PlatformCommission | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((c) => map.set(c.id, c.name))
    return map
  }, [categories])

  const filteredCommissions = useMemo(() => {
    if (!searchQuery.trim()) return commissions
    const q = searchQuery.toLowerCase().trim()
    return commissions.filter((c) => {
      const catName = (categoryNameById.get(c.service_category_id) || '').toLowerCase()
      return (
        c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) || catName.includes(q)
      )
    })
  }, [commissions, searchQuery, categoryNameById])

  const totalPages = Math.max(1, Math.ceil(filteredCommissions.length / pageSize))
  const paginatedCommissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCommissions.slice(start, start + pageSize)
  }, [filteredCommissions, currentPage, pageSize])

  const ledgerSum = Number(dashboard?.ledger_amount_sum || 0)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Take-Rate &amp; Commission Engine
          </h1>
          <p className="text-slate-500 text-xs">
            Manage platform take-rate splits, percentage rules, and flat fees by service taxonomy.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="text-slate-400 text-[10px] uppercase font-mono">Ledger volume:</span>
            <span className="text-emerald-800 font-bold text-xs">{formatUsd(ledgerSum)}</span>
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:bg-slate-50 hover:text-slate-900"
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
            className="h-9 rounded-lg px-3.5 text-xs font-semibold shadow-xs"
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
            className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-slate-100 border-b p-4 gap-3">
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
                  value={searchQuery}
                  onChange={(val) => {
                    setSearchQuery(val)
                    setCurrentPage(1)
                  }}
                  placeholder="Search rules…"
                  className="w-48 text-xs"
                />
                <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70 shrink-0">
                  {filteredCommissions.length} rules
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-slate-200/80 border-b bg-slate-50/80 font-semibold text-slate-700">
                    <th className="px-4 py-3">Rule Name</th>
                    <th className="px-4 py-3">Target Category</th>
                    <th className="px-4 py-3">Model Type</th>
                    <th className="px-4 py-3">Platform Rate</th>
                    <th className="px-4 py-3">Audit Timestamp</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCommissions.map((c) => {
                    const typeTone =
                      c.type === 'percentage' ? 'emerald' : c.type === 'flat' ? 'sky' : 'purple'

                    return (
                      <tr key={c.id} className="group transition-colors hover:bg-slate-50/60">
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            <span>{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 font-medium">
                          {categoryNameById.get(c.service_category_id) ||
                            c.service_category_id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone={typeTone} size="sm">
                            {c.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-emerald-800 font-mono tabular-nums tracking-tight text-sm">
                          {formatCommissionRate(c)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 font-mono tabular-nums text-[11px]">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Active Policy</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <IconButton
                            aria-label="Edit commission"
                            onClick={() => {
                              setEditing(c)
                              setIsOpen(true)
                            }}
                            className="rounded-lg opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </IconButton>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCommissions.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setCurrentPage(1)
              }}
              pageSizeOptions={[5, 8, 15, 30]}
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
