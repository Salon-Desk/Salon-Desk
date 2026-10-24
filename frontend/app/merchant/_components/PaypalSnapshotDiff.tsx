import { ArrowRight } from 'lucide-react'

export interface PaypalSnapshotDiffProps {
  payload: Record<string, unknown>
  snapshot: Record<string, unknown>
}

export function PaypalSnapshotDiff({ payload, snapshot }: PaypalSnapshotDiffProps) {
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
        <div className="flex-1 rounded-md border border-sky-200/70 bg-white/90 p-2">
          <span className="block font-sans text-[10px] font-semibold uppercase text-sky-800">
            Proposed Merchant ID
          </span>
          <span className="font-bold text-sky-950">{(payload.merchant_id as string) || '—'}</span>
        </div>
      </div>
    </div>
  )
}
