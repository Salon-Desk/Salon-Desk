'use client'

import { Clock, CreditCard, ShieldCheck, Sliders } from 'lucide-react'
import { useState } from 'react'

import { Card } from '@/components/ui'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useGetAdminChangeRequestsQuery } from '@/store/api/platformApi'
import type { ApiChangeRequest } from '@/types/api-org'

import { AdminQueryState } from '../_components/admin-query-state'
import { ChangeRequestReviewActions } from '../_components/change-request-review-actions'

type CrFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'all'

const FILTER_LABELS: Record<CrFilter, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  all: 'All',
}

function renderPayloadSummary(cr: ApiChangeRequest) {
  const payload = cr.payload_json as Record<string, unknown>
  if (cr.request_type === 'PAYPAL_ACCOUNT') {
    return (
      <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3.5 text-xs text-slate-700 space-y-1.5">
        <div className="font-semibold text-sky-950 flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 text-sky-600" />
          <span>Proposed PayPal Merchant Account</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
          <div>
            <span className="text-slate-400">Merchant ID: </span>
            <span className="font-bold text-slate-900">{String(payload.merchant_id || '—')}</span>
          </div>
          <div>
            <span className="text-slate-400">Currency: </span>
            <span className="font-bold text-slate-900">{String(payload.currency || 'USD')}</span>
          </div>
        </div>
      </div>
    )
  }

  if (cr.request_type === 'CANCELLATION_POLICY') {
    const data = (payload.data as Record<string, unknown>) || {}
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 text-xs text-slate-700 space-y-1.5">
        <div className="font-semibold text-amber-950 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
          <span>Proposed Policy Amendment</span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
          <div>
            <span className="text-slate-400">Cancel Window: </span>
            <span className="font-bold text-slate-900">
              {String(data.free_cancel_hours || '24')}h
            </span>
          </div>
          <div>
            <span className="text-slate-400">No-show Fee: </span>
            <span className="font-bold text-slate-900">${String(data.no_show_fee || '0')}</span>
          </div>
          <div>
            <span className="text-slate-400">Hold %: </span>
            <span className="font-bold text-slate-900">{String(data.hold_percent || '100')}%</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <pre className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600 font-mono">
      {JSON.stringify(cr.payload_json, null, 2)}
    </pre>
  )
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
    <div className="mx-auto w-full max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-extrabold text-xl text-slate-900 tracking-tight sm:text-2xl">
          Change Requests
        </h1>
        <p className="text-xs text-slate-500">
          Review and audit merchant policy amendments and PayPal payout configuration changes.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {(['PENDING', 'APPROVED', 'REJECTED', 'all'] as const).map((key) => {
          const isActive = status === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all cursor-pointer ${
                isActive
                  ? 'bg-stone-950 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {FILTER_LABELS[key]}
            </button>
          )
        })}
      </div>

      <AdminQueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loadingLabel="Loading requests…"
        errorLabel="Could not load change requests."
      >
        <div className="space-y-3.5">
          {requests.map((cr) => {
            const isPending = cr.status === 'PENDING'
            const isApproved = cr.status === 'APPROVED'

            return (
              <Card
                key={cr.id}
                className="space-y-3.5 rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 capitalize">
                        {cr.request_type.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-xs text-slate-500">
                        Salon: {cr.org_id.slice(0, 8)}…
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>Submitted {new Date(cr.created_at).toLocaleString()}</span>
                    </div>
                  </div>

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
                    {cr.status.toLowerCase()}
                  </span>
                </div>

                {renderPayloadSummary(cr)}

                {isPending && (
                  <div className="pt-2 border-t border-slate-100">
                    <ChangeRequestReviewActions request={cr} />
                  </div>
                )}
              </Card>
            )
          })}

          {requests.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <Sliders className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2.5 text-sm font-semibold text-slate-700">
                No requests in this view
              </p>
              <p className="mt-1 text-xs text-slate-400">
                All merchant policy and PayPal account requests for this filter have been handled.
              </p>
            </div>
          )}
        </div>
      </AdminQueryState>
    </div>
  )
}
