'use client'

import { Check, ChevronDown, ChevronUp, Copy, FileText, MessageSquare } from 'lucide-react'

import { RichText } from '@/components/chat/RichText'
import { cn } from '@/lib/utils'
import type { DisputeCase } from '@/types/dispute'

export interface AdvocateLaneProps {
  dispute: DisputeCase
  copiedRebuttal: boolean
  onCopyRebuttal: () => void
  isRebuttalExpanded: boolean
  onToggleRebuttalExpanded: () => void
}

export function AdvocateLane({
  dispute,
  copiedRebuttal,
  onCopyRebuttal,
  isRebuttalExpanded,
  onToggleRebuttalExpanded,
}: AdvocateLaneProps) {
  const transcripts =
    dispute.transcript_excerpt_json ?? dispute.investigator_report_json?.transcript_excerpt

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs transition-all hover:border-slate-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs shadow-2xs">
            2
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Advocate Agent (Legal Rebuttal &amp; Exhibit)
            </h4>
            <p className="text-[11px] text-slate-500 truncate sm:whitespace-normal">
              Formulates PayPal Disputes defense citing verified timestamps and chat proof
            </p>
          </div>
        </div>
        <span className="text-[10px] sm:text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full shrink-0 self-start sm:self-auto">
          Reason Code Defense
        </span>
      </div>

      {/* Legal Rebuttal Body */}
      <div className="pt-3 space-y-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-3.5 text-xs text-slate-700 leading-relaxed font-sans break-words relative">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <span>Formulated Legal Defense Statement</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onCopyRebuttal}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Copy defense text"
              >
                {copiedRebuttal ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onToggleRebuttalExpanded}
                className="inline-flex items-center gap-0.5 text-[10px] font-medium text-indigo-600 hover:text-indigo-800 px-1.5 py-0.5 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                <span>{isRebuttalExpanded ? 'Collapse' : 'Expand'}</span>
                {isRebuttalExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          <div
            className={cn(
              'transition-all duration-200',
              isRebuttalExpanded
                ? 'max-h-none'
                : 'max-h-36 sm:max-h-48 overflow-y-auto scrollbar-thin',
            )}
          >
            <RichText
              content={
                dispute.advocate_rebuttal_text ||
                'Compiling legal rebuttal based on cryptographic proof...'
              }
            />
          </div>
        </div>

        {/* Verified Chat Exhibit Timeline */}
        <div className="rounded-xl border border-indigo-100/90 bg-indigo-50/40 p-3 sm:p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
              <MessageSquare className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              <span>Verified Booking Chat Transcript Exhibit</span>
            </div>
            <span className="text-[10px] font-mono font-medium text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
              Ed25519 Sealed
            </span>
          </div>

          {transcripts && transcripts.length > 0 ? (
            <div className="space-y-2 text-xs">
              {transcripts.map((item, idx) => {
                const isUser = item.role === 'user' || item.role === 'client'
                return (
                  <div
                    key={idx}
                    className={cn(
                      'rounded-xl p-2.5 sm:p-3 border text-xs transition-colors',
                      isUser
                        ? 'bg-white border-indigo-100 shadow-2xs'
                        : 'bg-slate-50/90 border-slate-200/80',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider',
                          isUser ? 'text-indigo-700' : 'text-slate-600',
                        )}
                      >
                        {isUser ? 'Client Acceptance & Consent' : 'Salon Confirmation'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Exhibit Item #{idx + 1}
                      </span>
                    </div>
                    <p className="text-slate-800 font-medium break-words leading-relaxed">
                      {item.english || item.message || item.amharic}
                    </p>
                    {item.amharic && item.english && (
                      <p className="text-[11px] text-slate-500 italic mt-1 border-t border-slate-100 pt-1">
                        {item.amharic}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="rounded-xl bg-white border border-indigo-100/90 p-2.5 sm:p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-0.5">
                  Client Acceptance &amp; Policy Consent:
                </span>
                <p className="text-slate-800 font-medium break-words leading-relaxed">
                  &quot;I want to book braids Saturday at 3:00 PM with Selam. I accept the $30
                  no-show fee policy.&quot;
                </p>
              </div>

              <div className="rounded-xl bg-white/80 border border-slate-200/70 p-2.5 sm:p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Salon Confirmation Notice:
                </span>
                <p className="text-slate-700 italic break-words leading-relaxed">
                  &quot;Your appointment is confirmed. If you miss your appointment, the $30 deposit
                  hold will be captured.&quot;
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
