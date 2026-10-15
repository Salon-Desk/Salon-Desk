'use client'

import { Edit2, Percent, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card, IconButton } from '@/components/ui'
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
    data: commissions = [],
    isLoading,
    isError,
    refetch,
  } = useGetAdminCommissionsQuery(undefined, { skip: skipAdminApi })
  const { data: categories = [] } = useGetAdminCategoriesQuery(undefined, { skip: skipAdminApi })
  const { data: dashboard } = useGetAdminDashboardQuery(undefined, { skip: skipAdminApi })

  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<PlatformCommission | null>(null)

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((c) => map.set(c.id, c.name))
    return map
  }, [categories])

  const ledgerSum = Number(dashboard?.ledger_amount_sum || 0)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Commission &amp; Fees
          </h1>
          <p className="text-slate-500 text-xs">Platform take-rate rules by service category.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-200/90 bg-white px-3.5 py-1.5 shadow-xs">
            <span className="text-slate-400 text-[10px] block uppercase font-medium">
              Ledger volume
            </span>
            <span className="text-emerald-800 font-bold text-sm">{formatUsd(ledgerSum)}</span>
          </div>
          <PrimaryButton
            title="Add commission"
            size="sm"
            fullWidth={false}
            icon={<Plus className="h-3.5 w-3.5" />}
            className="h-9 rounded-xl px-3.5 text-xs"
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
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <Percent className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">No commission rules yet</p>
            <PrimaryButton
              title="Create first rule"
              size="sm"
              fullWidth={false}
              className="mt-4 h-9 rounded-xl px-4"
              onClick={() => {
                setEditing(null)
                setIsOpen(true)
              }}
            />
          </div>
        ) : null}

        {commissions.length > 0 ? (
          <Card
            padding="lg"
            className="space-y-4 rounded-3xl border border-slate-200/90 bg-white shadow-xs"
          >
            <div className="flex items-center justify-between border-slate-100 border-b pb-3">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Category take-rates</h2>
                <p className="text-slate-500 text-xs">Applied when bookings capture</p>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {commissions.length} rules
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/90">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-slate-200 border-b bg-slate-50 font-semibold text-slate-700">
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Rate</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {categoryNameById.get(c.service_category_id) ||
                          c.service_category_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600">{c.type}</td>
                      <td className="px-4 py-3 font-bold text-emerald-800 font-mono">
                        {formatCommissionRate(c)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <IconButton
                          aria-label="Edit commission"
                          onClick={() => {
                            setEditing(c)
                            setIsOpen(true)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        }}
      />
    </div>
  )
}
