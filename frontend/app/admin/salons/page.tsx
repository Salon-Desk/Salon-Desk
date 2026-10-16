'use client'

import { Building2, CheckCircle2, Copy, PauseCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card, SearchInput } from '@/components/ui'
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

  const {
    data: allOrganizations = [],
    isLoading,
    isError,
    refetch,
  } = useGetAdminOrganizationsQuery(undefined, { skip: skipAdminApi })
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
    toast.success('Salon ID copied to clipboard', toastColor.success)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleApprove = async (org: ApiOrganization) => {
    try {
      await approveOrg(org.id).unwrap()
      toast.success(`${org.name} approved successfully`, toastColor.success)
    } catch (err) {
      toast.error(
        String((err as { data?: { detail?: string } })?.data?.detail || 'Approve failed'),
        toastColor.error,
      )
    }
  }

  const handleSuspend = async (org: ApiOrganization) => {
    try {
      await suspendOrg(org.id).unwrap()
      toast.success(`${org.name} suspended`, toastColor.success)
    } catch (err) {
      toast.error(
        String((err as { data?: { detail?: string } })?.data?.detail || 'Suspend failed'),
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
            Partner Salons
          </h1>
          <p className="text-xs text-slate-500">
            Verify, approve, and manage multi-tenant salon organizations and sandbox credentials.
          </p>
        </div>
      </div>

      {/* Filter bar & Search */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'pending', 'approved', 'suspended'] as const).map((key) => {
            const isActive = filter === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold capitalize transition-all cursor-pointer ${
                  isActive
                    ? 'bg-stone-950 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{key}</span>
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
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
            onChange={setSearchQuery}
            placeholder="Search salon name or ID…"
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
          {organizations.map((org) => {
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

            return (
              <Card
                key={org.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 font-extrabold text-xs text-stone-950 shadow-xs">
                    {initials || <Building2 className="h-4.5 w-4.5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{org.name}</h3>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isPending
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-500'
                              : isPending
                                ? 'bg-amber-500 animate-pulse'
                                : 'bg-rose-500'
                          }`}
                        />
                        {org.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                      {org.description || 'Modern boutique salon on SalonDesk network.'}
                    </p>

                    <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-400 font-mono">
                      <span>ID: {org.id.slice(0, 12)}…</span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(org.id)}
                        className="inline-flex items-center gap-1 hover:text-slate-700 cursor-pointer text-[10px]"
                        title="Copy full UUID"
                      >
                        <Copy className="h-2.5 w-2.5" />
                        <span>{copiedId === org.id ? 'Copied' : 'Copy'}</span>
                      </button>
                      <span>·</span>
                      <span>Owner: {org.owner_id ? `${org.owner_id.slice(0, 8)}…` : 'Direct'}</span>
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
                      className="h-9 rounded-xl px-4 text-xs font-semibold shadow-xs"
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
                      className="h-9 rounded-xl px-3.5 text-xs shadow-xs"
                      onClick={() => void handleSuspend(org)}
                    />
                  )}
                </div>
              </Card>
            )
          })}

          {organizations.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <Building2 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2.5 text-sm font-semibold text-slate-700">No salons found</p>
              <p className="mt-1 text-xs text-slate-400">
                {searchQuery
                  ? `No salons matching "${searchQuery}".`
                  : 'No organizations match the selected filter.'}
              </p>
              {(filter !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilter('all')
                    setSearchQuery('')
                  }}
                  className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </AdminQueryState>
    </div>
  )
}
