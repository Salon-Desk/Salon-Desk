'use client'

import { CheckCircle2, PauseCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card } from '@/components/ui'
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
  const {
    data: allOrganizations = [],
    isLoading,
    isError,
    refetch,
  } = useGetAdminOrganizationsQuery(undefined, { skip: skipAdminApi })
  const [approveOrg, { isLoading: approving }] = useApproveOrganizationMutation()
  const [suspendOrg, { isLoading: suspending }] = useSuspendOrganizationMutation()

  const organizations = useMemo(() => {
    if (filter === 'all') return allOrganizations
    return allOrganizations.filter((o) => o.status === filter)
  }, [allOrganizations, filter])

  const counts = useMemo(
    () => ({
      all: allOrganizations.length,
      pending: allOrganizations.filter((o) => o.status === 'pending').length,
      approved: allOrganizations.filter((o) => o.status === 'approved').length,
      suspended: allOrganizations.filter((o) => o.status === 'suspended').length,
    }),
    [allOrganizations],
  )

  const handleApprove = async (org: ApiOrganization) => {
    try {
      await approveOrg(org.id).unwrap()
      toast.success(`${org.name} approved`, toastColor.success)
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
    <div className="mx-auto w-full max-w-6xl space-y-5 animate-in fade-in duration-300">
      <div>
        <h1 className="font-extrabold text-xl text-slate-900 sm:text-2xl">Salons</h1>
        <p className="text-xs text-slate-500">
          Approve or suspend organizations from org-owner sign-up.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'suspended'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              filter === key ? 'bg-stone-950 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {key} ({counts[key]})
          </button>
        ))}
      </div>

      <AdminQueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loadingLabel="Loading salons…"
        errorLabel="Could not load organizations."
      >
        <div className="space-y-3">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">{org.name}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-700">
                    {org.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {org.description || 'No description'} · {org.id.slice(0, 8)}…
                </p>
              </div>
              <div className="flex gap-2">
                {org.status !== 'approved' ? (
                  <PrimaryButton
                    title={approving ? 'Approving…' : 'Approve'}
                    size="sm"
                    fullWidth={false}
                    isLoading={approving}
                    icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    className="h-9 rounded-xl px-3 text-xs"
                    onClick={() => void handleApprove(org)}
                  />
                ) : null}
                {org.status !== 'suspended' ? (
                  <PrimaryButton
                    title={suspending ? 'Suspending…' : 'Suspend'}
                    variant="destructive"
                    size="sm"
                    fullWidth={false}
                    isLoading={suspending}
                    icon={<PauseCircle className="h-3.5 w-3.5" />}
                    className="h-9 rounded-xl px-3 text-xs"
                    onClick={() => void handleSuspend(org)}
                  />
                ) : null}
              </div>
            </Card>
          ))}
          {organizations.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No salons match this filter.</p>
          ) : null}
        </div>
      </AdminQueryState>
    </div>
  )
}
