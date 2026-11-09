'use client'

import { AlertTriangle, Check, CheckCircle2, Copy, Lock, ShieldCheck } from 'lucide-react'

import type { DisputeCase } from '@/types/dispute'

export interface InvestigatorLaneProps {
  dispute: DisputeCase
  copiedDigest: boolean
  onCopyDigest: () => void
}

export function InvestigatorLane({ dispute, copiedDigest, onCopyDigest }: InvestigatorLaneProps) {
  const report = dispute.investigator_report_json

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs transition-all hover:border-slate-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs shadow-2xs">
            1
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Investigator Agent (Cryptographic Verification)
            </h4>
            <p className="text-[11px] text-slate-500 truncate sm:whitespace-normal">
              Deterministic verification of Ed25519 signature &amp; SHA-256 financial chain
            </p>
          </div>
        </div>
        {dispute.consent_verified && dispute.ledger_chain_verified ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-700 shrink-0 self-start sm:self-auto">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Chain Valid
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-700 shrink-0 self-start sm:self-auto">
            <AlertTriangle className="h-3.5 w-3.5" />
            Audit Gaps Found
          </span>
        )}
      </div>

      <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        {/* Consent Card */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <Lock className="h-3 w-3 text-slate-400" />
              Ed25519 Client Consent
            </span>
            {dispute.consent_verified ? (
              <span className="font-bold text-emerald-700 text-[11px] flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            ) : (
              <span className="font-bold text-rose-600 text-[11px]">Unverified</span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-1.5 rounded-lg bg-white/80 border border-slate-200/60 p-1.5 font-mono text-[10px] text-slate-600">
            <span className="truncate" title={report?.terms_text_hash || 'UNVERIFIED'}>
              Digest:{' '}
              {report?.terms_text_hash
                ? `${report.terms_text_hash.slice(0, 14)}...${report.terms_text_hash.slice(-8)}`
                : 'UNVERIFIED'}
            </span>
            {report?.terms_text_hash && (
              <button
                type="button"
                onClick={onCopyDigest}
                className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0 cursor-pointer"
                title="Copy SHA-256 Digest"
              >
                {copiedDigest ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Ledger Integrity Card */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-slate-400" />
              Audit Ledger Integrity
            </span>
            {dispute.ledger_chain_verified ? (
              <span className="font-bold text-emerald-700 text-[11px] flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Valid Chain
              </span>
            ) : (
              <span className="font-bold text-rose-600 text-[11px]">Chain Broken</span>
            )}
          </div>
          <div className="mt-2 rounded-lg bg-white/80 border border-slate-200/60 p-1.5 font-mono text-[10px] text-slate-600 truncate">
            {dispute.ledger_entries_checked} sequential records verified (SHA-256)
          </div>
        </div>
      </div>
    </div>
  )
}
