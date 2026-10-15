'use client'

import { useState } from 'react'

import { Card } from '@/components/ui'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useGetAdminChangeRequestsQuery } from '@/store/api/platformApi'

import { AdminQueryState } from '../_components/admin-query-state'
import { ChangeRequestReviewActions } from '../_components/change-request-review-actions'

type CrFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'all'

const FILTER_LABELS: Record<CrFilter, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  all: 'All',
}

export default function AdminRequestsPage() {
  const { skipAdminApi } = useAdminSession()
  const [status, setStatus] = useState<CrFilter>('PENDING')
  const {
    data: requests = [],
    isLoading,
    isError,
    refetch,
  } = useGetAdminChangeRequestsQuery(status === 'all' ? undefined : { status }, {
    skip: skipAdminApi,
  })

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 animate-in fade-in duration-300">
      <div>
        <h1 className="font-extrabold text-xl text-slate-900 sm:text-2xl">Change requests</h1>
        <p className="text-xs text-slate-500">Review merchant PayPal / policy change requests.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['PENDING', 'APPROVED', 'REJECTED', 'all'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === key ? 'bg-stone-950 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      <AdminQueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loadingLabel="Loading requests…"
        errorLabel="Could not load change requests."
      >
        <div className="space-y-3">
          {requests.map((cr) => (
            <Card
              key={cr.id}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-sm text-slate-900 capitalize">
                    {cr.request_type.replace(/_/g, ' ').toLowerCase()}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Org {cr.org_id.slice(0, 8)}… · {new Date(cr.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize">
                  {cr.status.toLowerCase()}
                </span>
              </div>
              <pre className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600">
                {JSON.stringify(cr.payload_json, null, 2)}
              </pre>
              {cr.status === 'PENDING' ? <ChangeRequestReviewActions request={cr} /> : null}
            </Card>
          ))}
          {requests.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No change requests in this view.
            </p>
          ) : null}
        </div>
      </AdminQueryState>
    </div>
  )
}
