'use client'

import { ArrowUpRight, CheckCircle2, Clock, Download, Sparkles, XCircle } from 'lucide-react'

import { NEXT_PUBLIC_ENABLE_SIMULATION } from '@/lib/env'
import { formatUsd } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DisputeCase } from '@/types/dispute'

export interface EvidenceActionsProps {
  dispute: DisputeCase
  pdfUrl: string
  paypalResolutionUrl: string
  disputeTotal: number
  isResolvedSeller: boolean
  isResolvedBuyer: boolean
  isUnderReview: boolean
  isAdjudicating: boolean
  onAdjudicateSandbox: (outcome: 'SELLER_FAVOR' | 'BUYER_FAVOR') => Promise<void>
}

export function EvidenceActions({
  dispute,
  pdfUrl,
  paypalResolutionUrl,
  disputeTotal,
  isResolvedSeller,
  isResolvedBuyer,
  isUnderReview,
  isAdjudicating,
  onAdjudicateSandbox,
}: EvidenceActionsProps) {
  return (
    <div className="w-full space-y-2.5">
      {/* Status Feedback Banner */}
      {isResolvedSeller && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/95 px-3.5 py-2.5 text-xs text-emerald-800 shadow-2xs">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              {dispute.adjudication_outcome === 'CANCELED_BY_BUYER'
                ? 'Adjudicated: RESOLVED IN SELLER FAVOR (Buyer dropped dispute — Hold Released)'
                : 'Adjudicated: RESOLVED IN SELLER FAVOR (Fee Protected)'}
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-md self-start sm:self-auto shadow-2xs">
            +{formatUsd(disputeTotal)} Protected
          </span>
        </div>
      )}

      {isResolvedBuyer && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800 shadow-2xs">
          <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>Adjudicated: RESOLVED IN BUYER FAVOR (Hold Released to Cardholder)</span>
        </div>
      )}

      {isUnderReview && (
        <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-800 shadow-2xs">
          <div className="flex items-center gap-2 font-medium min-w-0">
            <Clock className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            <span className="truncate">
              Response Logged &amp; Under PayPal Review (Case {dispute.paypal_dispute_id})
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <a
          href={paypalResolutionUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl font-bold text-xs shadow-md active:scale-[0.99] transition-all cursor-pointer text-white',
            isResolvedSeller
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800',
          )}
        >
          <span>
            {isResolvedSeller || isResolvedBuyer
              ? 'View Resolved Case on PayPal'
              : 'Respond on PayPal Resolution Center'}
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0" />
        </a>

        <a
          href={pdfUrl}
          download={`salondesk_evidence_${dispute.paypal_dispute_id}.pdf`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 bg-white font-semibold text-xs text-slate-700 hover:bg-slate-50 active:scale-[0.99] transition-all shadow-2xs shrink-0 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span>Download PDF Dossier</span>
        </a>
      </div>

      {/* Sandbox Simulation Bar */}
      {NEXT_PUBLIC_ENABLE_SIMULATION && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 sm:px-3 sm:py-2 text-[11px] text-amber-900">
          <div className="flex items-center gap-1.5 font-medium shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>Sandbox Demo Controls:</span>
          </div>
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              disabled={isAdjudicating || isResolvedSeller}
              onClick={() => onAdjudicateSandbox('SELLER_FAVOR')}
              className="flex-1 sm:flex-none text-center rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 sm:py-1 font-semibold text-[10px] sm:text-[11px] text-emerald-700 shadow-2xs hover:bg-emerald-50 active:scale-95 disabled:opacity-40 cursor-pointer transition-all"
            >
              {isAdjudicating ? 'Processing...' : 'Simulate Win (Seller Favor)'}
            </button>
            <button
              type="button"
              disabled={isAdjudicating || isResolvedBuyer}
              onClick={() => onAdjudicateSandbox('BUYER_FAVOR')}
              className="flex-1 sm:flex-none text-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:py-1 font-semibold text-[10px] sm:text-[11px] text-slate-600 shadow-2xs hover:bg-slate-50 active:scale-95 disabled:opacity-40 cursor-pointer transition-all"
            >
              Simulate Concede
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
