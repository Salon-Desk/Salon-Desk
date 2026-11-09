'use client'

import { RichText } from '@/components/chat/RichText'
import { cn } from '@/lib/utils'
import type { DisputeCase } from '@/types/dispute'

export interface SkepticLaneProps {
  dispute: DisputeCase
  winProbability: number
}

export function SkepticLane({ dispute, winProbability }: SkepticLaneProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs transition-all hover:border-slate-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-violet-50 border border-violet-200 text-violet-700 font-bold text-xs shadow-2xs">
            3
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Skeptic Agent (Win Probability &amp; Recommendation)
            </h4>
            <p className="text-[11px] text-slate-500 truncate sm:whitespace-normal">
              Challenges merchant stance to avoid dispute fees and optimize win probability
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap shrink-0 self-start sm:self-auto">
          <span className="text-xs sm:text-sm font-extrabold font-mono text-indigo-700">
            {winProbability}%
          </span>
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
              dispute.recommended_action === 'FILE_EVIDENCE'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200',
            )}
          >
            {dispute.recommended_action === 'FILE_EVIDENCE'
              ? 'RECOMMEND: SUBMIT EVIDENCE'
              : 'RECOMMEND: SETTLE'}
          </span>
        </div>
      </div>

      <div className="pt-3 space-y-3">
        {/* Visual Progress Bar with markers */}
        <div className="space-y-1">
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                winProbability >= 85
                  ? 'bg-gradient-to-r from-emerald-500 to-indigo-600'
                  : winProbability >= 65
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                    : 'bg-rose-500',
              )}
              style={{ width: `${winProbability}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
            <span>0% (Loss Risk)</span>
            <span>50% (Contested)</span>
            <span>100% (High Confidence)</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-600 leading-relaxed break-words">
          <span className="font-semibold text-slate-900 block mb-1">Skeptic Risk Evaluation:</span>
          <RichText
            content={
              dispute.skeptic_critique ||
              'Evidence meets PayPal merchant protection guidelines. Mathematical signature and continuous ledger timestamps substantiate full fee defense.'
            }
          />
        </div>
      </div>
    </div>
  )
}
