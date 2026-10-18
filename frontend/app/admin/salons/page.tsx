'use client'

import { Building2, CheckCircle2, Copy, PauseCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Pagination } from '@/components/table/Pagination'
import { Badge, Card, EmptyState, SearchInput } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useAdminSession } from '@/hooks/use-admin-session'
import {
  useApproveOrganizationMutation,
  useGetAdminOrganizationsQuery,
  useSuspendOrganizationMutation,
} from '@/store/api/platformApi'
import type { ApiOrganization, ApiOrgStatus } from '@/types/api-org'

import { AdminQueryState } from '../_components/admin-query-state'

type StatusFilter = 'all' | ApiOrgStatus

export default function AdminSalonsPage() {
  const { skipAdminApi } = useAdminSession()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  const {
    data: allOrganizationsData,
    isLoading,
    isError,
    refetch,
  } = useGetAdminOrganizationsQuery(undefined, { skip: skipAdminApi })
  const allOrganizations = allOrganizationsData?.items ?? []
  const [approveOrg, { isLoading: approving }] = useApproveOrganizationMutation()
  const [suspendOrg, { isLoading: suspending }] = useSuspendOrganizationMutation()

  const organizations = useMemo(() => {
    let result = allOrganizations
    if (filter !== 'all') {
      result = result.filter((o) => o.status === filter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          (o.description || '').toLowerCase().includes(q),
      )
    }
    return result
  }, [allOrganizations, filter, searchQuery])

  const totalPages = Math.max(1, Math.ceil(organizations.length / pageSize))
  const paginatedOrganizations = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return organizations.slice(start, start + pageSize)
  }, [organizations, currentPage, pageSize])

  const counts = useMemo(
    () => ({
      all: allOrganizations.length,
      pending: allOrganizations.filter((o) => o.status === 'pending').length,
      approved: allOrganizations.filter((o) => o.status === 'approved').length,
      suspended: allOrganizations.filter((o) => o.status === 'suspended').length,
    }),
    [allOrganizations],
  )

  const handleCopyId = (id: string) => {
    void navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success(`Salon UUID (${id.slice(0, 8)}…) copied`, toastColor.success)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleApprove = async (org: ApiOrganization) => {
    try {
      await approveOrg(org.id).unwrap()
      toast.success(`${org.name} successfully approved`, toastColor.success)
      void refetch()
    } catch (err) {
      toast.error(
        String((err as { data?: { detail?: string } })?.data?.detail || 'Approval failed'),
        toastColor.error,
      )
    }
  }

  const handleSuspend = async (org: ApiOrganization) => {
    try {
      await suspendOrg(org.id).unwrap()
      toast.success(`${org.name} suspended`, toastColor.success)
      void refetch()
    } catch (err) {
      toast.error(
        String((err as { data?: { detail?: string } })?.data?.detail || 'Suspension failed'),
        toastColor.error,
      )
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-xl text-slate-900 tracking-tight sm:text-2xl">
            Partner Salons Directory
          </h1>
          <p className="text-xs text-slate-500">
            Verify, approve, and audit multi-tenant salon organizations, take-rate rules, and
            sandbox credentials.
          </p>
        </div>
      </div>

      {/* Filter bar & Search */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'pending', 'approved', 'suspended'] as const).map((key) => {
            const isActive = filter === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setFilter(key)
                  setCurrentPage(1)
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{key}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {counts[key]}
                </span>
              </button>
            )
          })}
        </div>

        <div className="w-full sm:w-72">
          <SearchInput
            value={searchQuery}
            onChange={(q) => {
              setSearchQuery(q)
              setCurrentPage(1)
            }}
            placeholder="Search salon name or UUID…"
            shortcut="⌘K"
            className="w-full text-xs"
          />
        </div>
      </div>

      {/* Salons List */}
      <AdminQueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loadingLabel="Loading salons…"
        errorLabel="Could not load organizations."
      >
        <div className="space-y-3">
          {paginatedOrganizations.map((org) => {
            const isApproved = org.status === 'approved'
            const isPending = org.status === 'pending'
            const isSuspended = org.status === 'suspended'
            const initials = org.name
              .split(' ')
              .map((w) => w[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase()

            const statusTone = isApproved ? 'emerald' : isPending ? 'amber' : 'rose'

            return (
              <Card
                key={org.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 font-extrabold text-xs text-stone-950 shadow-xs">
                    {initials || <Building2 className="h-5 w-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                        {org.name}
                      </h3>
                      <Badge tone={statusTone} size="sm">
                        {org.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                      {org.description ||
                        'Modern boutique salon operating with PayPal zero-debit authorization holds.'}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                      {/* Interactive UUID copy chip */}
                      <button
                        type="button"
                        onClick={() => handleCopyId(org.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-xs"
                        title="Copy full UUID"
                      >
                        <span>UUID: {org.id.slice(0, 8)}…</span>
                        {copiedId === org.id ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-slate-400" />
                        )}
                      </button>

                      <span>·</span>
                      <span className="font-mono text-slate-400">
                        Owner: {org.owner_id ? `${org.owner_id.slice(0, 8)}…` : 'Direct'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!isApproved && (
                    <PrimaryButton
                      title={approving ? 'Approving…' : 'Approve Salon'}
                      size="sm"
                      fullWidth={false}
                      isLoading={approving}
                      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      className="h-8.5 rounded-lg px-3.5 text-xs font-semibold shadow-xs"
                      onClick={() => void handleApprove(org)}
                    />
                  )}
                  {!isSuspended && (
                    <PrimaryButton
                      title={suspending ? 'Suspending…' : 'Suspend'}
                      variant="destructive"
                      size="sm"
                      fullWidth={false}
                      isLoading={suspending}
                      icon={<PauseCircle className="h-3.5 w-3.5" />}
                      className="h-8.5 rounded-lg px-3.5 text-xs font-semibold shadow-xs"
                      onClick={() => void handleSuspend(org)}
                    />
                  )}
                </div>
              </Card>
            )
          })}

          {organizations.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={organizations.length}
              pageSize={pageSize}
              setCurrentPage={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setCurrentPage(1)
              }}
              pageSizeOptions={[5, 8, 16, 32]}
            />
          )}

          {organizations.length === 0 && (
            <EmptyState
              icon={Building2}
              title="No salons found"
              description={
                searchQuery
                  ? `No salons matching "${searchQuery}". Clear your search query or switch filters.`
                  : 'No salons match the selected status category.'
              }
              action={
                filter !== 'all' || searchQuery ? (
                  <PrimaryButton
                    title="Clear filters"
                    size="sm"
                    fullWidth={false}
                    className="h-8 rounded-lg px-4 text-xs"
                    onClick={() => {
                      setFilter('all')
                      setSearchQuery('')
                    }}
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
