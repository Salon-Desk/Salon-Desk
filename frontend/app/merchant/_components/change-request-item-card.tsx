'use client'

import { ArrowRight, CheckCircle2, Clock, Info, XCircle } from 'lucide-react'

import type { ApiChangeRequest } from '@/types/api-org'

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
    <div className="space-y-3 rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 text-xs shadow-2xs transition-colors hover:border-slate-300 hover:bg-white">
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

function PolicySnapshotDiff({
  payload,
  snapshot,
}: {
  payload: Record<string, unknown>
  snapshot: Record<string, unknown>
}) {
  const snapshotData = (snapshot.data as Record<string, unknown>) ?? {}
  const payloadData = (payload.data as Record<string, unknown>) ?? {}

  const prevNotice = Number(snapshotData.free_cancel_hours ?? snapshotData.policyHours ?? 24)
  const prevNoShow = Number(snapshotData.no_show_fee_percent ?? snapshotData.noShowFeePercent ?? 50)
  const prevLateCancel = Number(
    snapshotData.late_cancel_fee_percent ?? snapshotData.lateCancelFeePercent ?? 25,
  )

  const nextNotice = Number(payloadData.free_cancel_hours ?? payload.policyHours ?? 24)
  const nextNoShow = Number(payloadData.no_show_fee_percent ?? payload.noShowFeePercent ?? 50)
  const nextLateCancel = Number(
    payloadData.late_cancel_fee_percent ?? payload.lateCancelFeePercent ?? 25,
  )

  return (
    <div className="space-y-2 rounded-lg border border-amber-100 bg-amber-50/40 p-3">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-amber-950">
        Terms Comparison Snapshot
      </span>
      <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
        <div className="space-y-1 rounded-md border border-slate-200/60 bg-white/80 p-2">
          <span className="block text-[10px] font-semibold uppercase text-slate-400">
            Previous Enforced Rules
          </span>
          <div className="space-y-0.5 text-xs text-slate-700">
            <div>
              Notice Cutoff: <span className="font-bold text-slate-900">{prevNotice}h</span>
            </div>
            <div>
              No-Show Penalty: <span className="font-bold text-slate-900">{prevNoShow}%</span>
            </div>
            <div>
              Late Cancel: <span className="font-bold text-slate-900">{prevLateCancel}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-1 rounded-md border border-amber-200/80 bg-white/90 p-2 shadow-2xs">
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-amber-800">
            <span>Proposed Amendment</span>
            <ArrowRight className="h-3 w-3 text-amber-600" />
          </span>
          <div className="space-y-0.5 text-xs text-slate-800">
            <div>
              Notice Cutoff: <span className="font-bold text-amber-900">{nextNotice}h</span>
            </div>
            <div>
              No-Show Penalty: <span className="font-bold text-rose-800">{nextNoShow}%</span>
            </div>
            <div>
              Late Cancel: <span className="font-bold text-amber-900">{nextLateCancel}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaypalSnapshotDiff({
  payload,
  snapshot,
}: {
  payload: Record<string, unknown>
  snapshot: Record<string, unknown>
}) {
  return (
    <div className="space-y-2 rounded-lg border border-sky-100 bg-sky-50/40 p-3">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-sky-950">
        Payout Destination Transition
      </span>
      <div className="flex flex-col gap-2 font-mono text-xs sm:flex-row sm:items-center">
        <div className="flex-1 rounded-md border border-slate-200/60 bg-white/80 p-2">
          <span className="block font-sans text-[10px] font-semibold uppercase text-slate-400">
            Previous Merchant ID
          </span>
          <span className="font-bold text-slate-800">
            {(snapshot.merchant_id as string) || 'None (Initial Setup)'}
          </span>
        </div>
        <ArrowRight className="hidden h-4 w-4 shrink-0 self-center text-sky-600 sm:block" />
        <div className="flex-1 rounded-md border border-sky-200/80 bg-white/90 p-2 shadow-2xs">
          <span className="block font-sans text-[10px] font-semibold uppercase text-sky-800">
            Proposed Merchant ID
          </span>
          <span className="font-bold text-sky-950">{(payload.merchant_id as string) || '—'}</span>
        </div>
      </div>
    </div>
  )
}
