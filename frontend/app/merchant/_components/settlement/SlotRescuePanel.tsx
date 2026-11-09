'use client'

import { CheckCircle2, ChevronDown, Clock, RefreshCw, Scale, Sparkles, Users } from 'lucide-react'

import { PrimaryButton } from '@/components/button'
import { RichText } from '@/components/chat/RichText'
import { Badge } from '@/components/ui'
import { formatUsd } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Booking } from '@/types'
import type { SlotRescueResponse } from '@/types/dispute'

export interface SlotRescuePanelProps {
  booking: Booking
  rescueResult: SlotRescueResponse | null
  showRescueRounds: boolean
  onToggleRescueRounds: () => void
  waitlistEntries: Array<{
    id: string
    client_name: string
    client_email: string
    preferred_starts_at: string
  }>
  isLoadingWaitlist: boolean
  selectedWaitlistId: string | null
  onSelectWaitlistId: (id: string) => void
  isRescuing: boolean
  onExecuteRescue: () => Promise<void>
  isNoShowCaptured: boolean
  isVoided: boolean
  showRescuePanel: boolean
  onShowRescuePanel: () => void
}

export function SlotRescuePanel({
  booking,
  rescueResult,
  showRescueRounds,
  onToggleRescueRounds,
  waitlistEntries,
  isLoadingWaitlist,
  selectedWaitlistId,
  onSelectWaitlistId,
  isRescuing,
  onExecuteRescue,
  isNoShowCaptured,
  isVoided,
  showRescuePanel,
  onShowRescuePanel,
}: SlotRescuePanelProps) {
  if (!isNoShowCaptured && !isVoided && !rescueResult && !showRescuePanel) {
    return (
      <div className="text-center pt-0.5">
        <button
          type="button"
          onClick={onShowRescuePanel}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
        >
          <Sparkles className="h-3 w-3" />
          <span>Simulate Slot Rescue &amp; Waitlist Refill</span>
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-indigo-50/30 p-4 space-y-3.5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span className="truncate">Slot Rescue &amp; Waitlist Refill</span>
              <span className="rounded-md bg-indigo-100/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-800 shrink-0">
                Referee AI
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 truncate sm:whitespace-normal">
              Autonomous waitlist refill &amp; penalty relief
            </p>
          </div>
        </div>
        {rescueResult && (
          <div className="shrink-0 self-start sm:self-auto">
            <Badge tone="emerald" dot>
              Slot Refilled
            </Badge>
          </div>
        )}
      </div>

      {rescueResult ? (
        /* Successful Rescue Result View */
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Chair Successfully Refilled</span>
              </span>
              <span className="font-mono text-[11px] font-extrabold text-emerald-800 self-start sm:self-auto">
                {rescueResult.action === 'REFUNDED' ? 'FEE REFUNDED' : 'HOLD VOIDED'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              <div className="rounded-lg bg-white/80 p-2 border border-emerald-100 min-w-0">
                <span className="text-[10px] text-slate-400 block truncate">
                  Replacement Client
                </span>
                <span className="font-bold text-slate-900 truncate block">
                  {rescueResult.replacement_client_name}
                </span>
                <span className="text-[10px] font-mono text-emerald-700 truncate block">
                  #{rescueResult.replacement_booking_id.slice(0, 8)}
                </span>
              </div>
              <div className="rounded-lg bg-white/80 p-2 border border-emerald-100 min-w-0">
                <span className="text-[10px] text-slate-400 block truncate">
                  {rescueResult.action === 'REFUNDED' ? 'Refund Amount' : 'Waived Penalty'}
                </span>
                <span className="font-mono font-bold text-emerald-800 block truncate">
                  {formatUsd(Number(rescueResult.refund_amount || rescueResult.waived_amount))}
                </span>
                <span className="text-[10px] text-emerald-600 block truncate">
                  PayPal auto-settled
                </span>
              </div>
            </div>
          </div>

          {/* 3-Round Negotiation Transcript */}
          <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
            <button
              type="button"
              onClick={onToggleRescueRounds}
              className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors gap-2 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Scale className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">3-Round Referee Negotiation Log</span>
              </div>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200',
                  showRescueRounds && 'rotate-180',
                )}
              />
            </button>

            {showRescueRounds && (
              <div className="p-3 border-t border-slate-100 space-y-2.5 bg-slate-50/50">
                {rescueResult.negotiation_rounds?.map((rnd) => (
                  <div
                    key={rnd.round}
                    className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs space-y-1"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-mono font-bold text-slate-600">
                          {rnd.round}
                        </span>
                        <span className="truncate">{rnd.role}</span>
                      </span>
                      {rnd.verdict && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 self-start sm:self-auto">
                          {rnd.verdict}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 leading-relaxed break-words">
                      <RichText content={rnd.english} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Unrescued State — Candidate selection & Trigger button */
        <div className="space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            This chair was vacated due to cancellation or no-show. The referee agent can refill it
            with a matching waitlisted client, and automatically void or refund the penalty hold to
            maintain customer trust.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                Matching Waitlist Queue
              </span>
              <span className="font-mono text-slate-400">
                {isLoadingWaitlist ? 'Checking...' : `${waitlistEntries.length} Available`}
              </span>
            </div>

            {isLoadingWaitlist ? (
              <div className="flex items-center justify-center py-4 text-xs text-slate-400 gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Searching waitlist candidates…</span>
              </div>
            ) : waitlistEntries.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {waitlistEntries.map((candidate) => {
                  const isSelected =
                    selectedWaitlistId === candidate.id ||
                    (!selectedWaitlistId && candidate.id === waitlistEntries[0].id)
                  return (
                    <div
                      key={candidate.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectWaitlistId(candidate.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onSelectWaitlistId(candidate.id)
                        }
                      }}
                      className={cn(
                        'flex items-center justify-between rounded-xl border p-2.5 text-xs transition-colors cursor-pointer',
                        isSelected
                          ? 'border-indigo-400 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-400'
                          : 'border-slate-200 bg-white hover:bg-slate-50',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 truncate">
                          {candidate.client_name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {candidate.client_email}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(candidate.preferred_starts_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 p-3 text-center text-xs text-slate-500">
                <p>No waiting candidates currently queueing for {booking.serviceName}.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Referee will allocate the next available waitlist match.
                </p>
              </div>
            )}
          </div>

          <PrimaryButton
            id="agent-slot-rescue-btn"
            variant="primary"
            fullWidth
            isDisabled={isRescuing}
            isLoading={isRescuing}
            onClick={onExecuteRescue}
            className="h-10 rounded-xl text-xs font-bold shadow-none bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              Rescue Slot &amp; Refill from Waitlist
            </span>
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}
