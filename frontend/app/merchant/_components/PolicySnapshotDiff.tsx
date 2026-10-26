import { ArrowRight } from 'lucide-react'

export interface PolicySnapshotDiffProps {
  payload: Record<string, unknown>
  snapshot: Record<string, unknown>
}

export function PolicySnapshotDiff({ payload, snapshot }: PolicySnapshotDiffProps) {
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

        <div className="space-y-1 rounded-md border border-amber-200/70 bg-white/90 p-2">
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
