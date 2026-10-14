'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card } from '@/components/ui'
import { useGetAdminChangeRequestsQuery } from '@/store/slice/adminApi'

import { ChangeRequestReviewActions } from '../_components/change-request-review-actions'

export default function AdminRequestsPage() {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const {
    data: requests = [],
    isLoading,
    isError,
    refetch,
  } = useGetAdminChangeRequestsQuery(status === 'all' ? undefined : { status })

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 animate-in fade-in duration-300">
      <div>
        <h1 className="font-extrabold text-xl text-slate-900 sm:text-2xl">Change requests</h1>
        <p className="text-xs text-slate-500">Review merchant PayPal / policy change requests.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              status === key ? 'bg-stone-950 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading requests…
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          <p>Could not load change requests.</p>
          <PrimaryButton
            title="Retry"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="mt-3 h-9 rounded-xl px-4"
            onClick={() => void refetch()}
          />
        </div>
      ) : null}

      <div className="space-y-3">
        {requests.map((cr) => (
          <Card key={cr.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-sm text-slate-900 capitalize">
                  {cr.request_type.replace(/_/g, ' ')}
                </p>
                <p className="text-[11px] text-slate-500">
                  Org {cr.org_id.slice(0, 8)}… · {new Date(cr.created_at).toLocaleString()}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize">
                {cr.status}
              </span>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600">
              {JSON.stringify(cr.payload_json, null, 2)}
            </pre>
            {cr.status === 'pending' || cr.status === 'PENDING' ? (
              <ChangeRequestReviewActions request={cr} />
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  )
}
