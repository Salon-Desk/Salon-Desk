'use client'

import { CheckCircle2, Clock, Info, XCircle } from 'lucide-react'

import type { ApiChangeRequest } from '@/types/api-org'

import { PaypalSnapshotDiff } from './PaypalSnapshotDiff'
import { PolicySnapshotDiff } from './PolicySnapshotDiff'

interface ChangeRequestItemCardProps {
  cr: ApiChangeRequest
  defaultOrgName?: string
}

export function ChangeRequestItemCard({ cr, defaultOrgName }: ChangeRequestItemCardProps) {
  const isPaypal = cr.request_type === 'PAYPAL_ACCOUNT'
  const isPolicy = cr.request_type === 'CANCELLATION_POLICY'
  const payload = (cr.payload_json || {}) as Record<string, unknown>
  const snapshot = (cr.current_snapshot_json || {}) as Record<string, unknown>

  const status = (cr.status || 'PENDING').toUpperCase()
  const orgName = cr.org_name || defaultOrgName || (payload.org_name as string) || 'Salon'
  const submitterName = cr.submitter_name || 'Salon Staff'

  return (
    <div className="space-y-3 rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 text-xs transition-colors hover:border-slate-300 hover:bg-white">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-900">
              {isPaypal
                ? 'PayPal Payout Destination Change'
                : isPolicy
                  ? 'Cancellation Policy Amendment'
                  : cr.request_type}
            </span>
            <span className="rounded-md bg-slate-200/70 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
              Req ID: {cr.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="font-medium text-slate-700">{orgName}</span>
            <span>·</span>
            <span>Submitted by {submitterName}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" />
              {new Date(cr.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status Pill */}
        <div className="self-start sm:self-auto">
          {status === 'APPROVED' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Approved &amp; Active
            </span>
          ) : status === 'REJECTED' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              Declined by Platform
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              Pending Compliance Review
            </span>
          )}
        </div>
      </div>

      {/* Meaningful Before & After Snapshot Comparison */}
      {isPolicy ? (
        <PolicySnapshotDiff payload={payload} snapshot={snapshot} />
      ) : isPaypal ? (
        <PaypalSnapshotDiff payload={payload} snapshot={snapshot} />
      ) : null}

      {/* Review Notes (if provided by admin) */}
      {cr.review_notes ? (
        <div className="flex items-start gap-2 rounded-lg bg-slate-100/80 p-2.5 text-[11px] text-slate-700">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-900">Platform Review Notes:</span>
            <p className="leading-relaxed text-slate-600">{cr.review_notes}</p>
            {cr.reviewed_at ? (
              <span className="block pt-0.5 text-[10px] text-slate-400">
                Reviewed on {new Date(cr.reviewed_at).toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
