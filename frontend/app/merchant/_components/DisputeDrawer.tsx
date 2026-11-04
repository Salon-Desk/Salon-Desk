'use client'

import {
  AlertTriangle,
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  Lock,
  MessageSquare,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import { RichText } from '@/components/chat/RichText'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { CustomDrawer } from '@/components/drawer/CustomDrawer'
import { toastColor } from '@/constant/toast-color'
import { getPortalAuthToken } from '@/lib/authSession'
import { NEXT_PUBLIC_ENABLE_SIMULATION } from '@/lib/env'
import { formatUsd } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  useAdjudicateSandboxDisputeMutation,
  useMakeDisputeOfferMutation,
  useSubmitDisputeEvidenceMutation,
} from '@/store/api/disputeApi'
import type { DisputeCase } from '@/types/dispute'

export interface DisputeDrawerProps {
  dispute: DisputeCase | null
  open: boolean
  onClose: () => void
  onDisputeUpdated?: (updated: DisputeCase) => void
}

export function DisputeDrawer({ dispute, open, onClose, onDisputeUpdated }: DisputeDrawerProps) {
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [offerDialogOpen, setOfferDialogOpen] = useState(false)
  const [offerAmount, setOfferAmount] = useState<string>('15.00')
  const [offerNote, setOfferNote] = useState<string>(
    'Goodwill partial refund settlement offer from salon owner.',
  )
  const [copiedDisputeId, setCopiedDisputeId] = useState(false)
  const [copiedRebuttal, setCopiedRebuttal] = useState(false)
  const [copiedDigest, setCopiedDigest] = useState(false)
  const [isRebuttalExpanded, setIsRebuttalExpanded] = useState(false)

  const [submitEvidence, { isLoading: isSubmittingEvidence }] = useSubmitDisputeEvidenceMutation()
  const [makeOffer, { isLoading: isSubmittingOffer }] = useMakeDisputeOfferMutation()
  const [adjudicateSandbox, { isLoading: isAdjudicating }] = useAdjudicateSandboxDisputeMutation()

  if (!dispute) return null

  const report = dispute.investigator_report_json
  const winProbability = dispute.skeptic_win_probability ?? 90
  const isEvidenceReady =
    dispute.status === 'EVIDENCE_READY' ||
    dispute.status === 'WAITING_FOR_SELLER_RESPONSE' ||
    dispute.status === 'OPEN'
  const isUnderReview = dispute.status === 'UNDER_REVIEW' || dispute.status === 'EVIDENCE_SUBMITTED'
  const isResolvedSeller = dispute.status === 'RESOLVED_SELLER_FAVOR'
  const isResolvedBuyer = dispute.status === 'RESOLVED_BUYER_FAVOR'

  const disputeTotal = Number(dispute.dispute_amount) || 0

  const handleCopyDisputeId = async () => {
    try {
      await navigator.clipboard.writeText(dispute.paypal_dispute_id)
      setCopiedDisputeId(true)
      toast.success('Dispute ID copied to clipboard', toastColor.info)
      setTimeout(() => setCopiedDisputeId(false), 2000)
    } catch {
      toast.error('Failed to copy Dispute ID', toastColor.error)
    }
  }

  const handleCopyDigest = async () => {
    const hash = report?.terms_text_hash
    if (!hash) return
    try {
      await navigator.clipboard.writeText(hash)
      setCopiedDigest(true)
      toast.success('SHA-256 Consent Digest copied to clipboard', toastColor.info)
      setTimeout(() => setCopiedDigest(false), 2000)
    } catch {
      toast.error('Failed to copy digest', toastColor.error)
    }
  }

  const handleCopyRebuttal = async () => {
    const text = dispute.advocate_rebuttal_text
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedRebuttal(true)
      toast.success('Legal rebuttal copied to clipboard', toastColor.info)
      setTimeout(() => setCopiedRebuttal(false), 2000)
    } catch {
      toast.error('Failed to copy rebuttal text', toastColor.error)
    }
  }

  const handleSubmitEvidence = async () => {
    try {
      const res = await submitEvidence({ disputeId: dispute.id }).unwrap()
      toast.success(
        `Cryptographic evidence dossier filed to PayPal! (Debug ID: ${res.paypal_debug_id || 'LIVE_SANDBOX_STAMP'})`,
        toastColor.success,
      )
      onDisputeUpdated?.(res)
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { detail?: string } })?.data?.detail || 'Failed to submit evidence'
      toast.error(errorMsg, toastColor.error)
    }
  }

  const handleMakeOffer = async () => {
    try {
      const parsed = parseFloat(offerAmount)
      if (isNaN(parsed) || parsed <= 0) {
        toast.error('Please enter a valid offer amount.', toastColor.error)
        return
      }
      const res = await makeOffer({
        disputeId: dispute.id,
        offer_amount: parsed,
        note: offerNote,
      }).unwrap()
      toast.success(
        `Settlement offer of ${formatUsd(parsed)} submitted to buyer.`,
        toastColor.success,
      )
      setOfferDialogOpen(false)
      onDisputeUpdated?.(res)
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { detail?: string } })?.data?.detail || 'Failed to make settlement offer'
      toast.error(errorMsg, toastColor.error)
    }
  }

  const handleAdjudicateSandbox = async (outcome: 'SELLER_FAVOR' | 'BUYER_FAVOR') => {
    try {
      const res = await adjudicateSandbox({ disputeId: dispute.id, outcome }).unwrap()
      if (outcome === 'SELLER_FAVOR') {
        toast.success(
          'PayPal Sandbox Adjudication Complete: RESOLVED IN SELLER FAVOR! (No-show fee retained)',
          toastColor.success,
        )
      } else {
        toast.info('PayPal Sandbox Adjudicated: RESOLVED IN BUYER FAVOR.', toastColor.info)
      }
      onDisputeUpdated?.(res)
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { detail?: string } })?.data?.detail ||
        'Failed to adjudicate sandbox dispute'
      toast.error(errorMsg, toastColor.error)
    }
  }

  const token = typeof window !== 'undefined' ? getPortalAuthToken('merchant') : ''
  const pdfUrl = `/api/v1/disputes/${dispute.id}/evidence.pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`
  const transcripts = dispute.transcript_excerpt_json ?? report?.transcript_excerpt

  return (
    <>
      <CustomDrawer
        open={open}
        onOpenChange={(isOpen) => !isOpen && onClose()}
        classNameContent="w-full sm:w-[94vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-[880px] bg-white sm:rounded-l-3xl border-l border-slate-200 shadow-2xl"
        classNameHeader="px-3 sm:px-6 py-3.5 sm:py-4 bg-white/95 backdrop-blur-md border-b border-slate-200/80"
        classNameBody="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5 bg-slate-50/50"
        classNameFooter="p-3 sm:px-6 sm:py-4 bg-white/95 backdrop-blur-md border-t border-slate-200/80"
        title={
          <div className="flex items-center gap-3 min-w-0 pr-8 sm:pr-10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/25 text-amber-600 shadow-2xs">
              <Scale className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                  Dispute Counsel AI
                </span>
                <button
                  type="button"
                  onClick={handleCopyDisputeId}
                  className="group inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer max-w-[150px] xs:max-w-[200px] sm:max-w-none"
                  title="Click to copy PayPal Dispute ID"
                >
                  <span className="truncate">{dispute.paypal_dispute_id}</span>
                  {copiedDisputeId ? (
                    <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="h-3 w-3 text-slate-400 group-hover:text-slate-600 shrink-0" />
                  )}
                </button>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wide uppercase',
                    isResolvedSeller
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : isResolvedBuyer
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : isUnderReview
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200',
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full shrink-0',
                      isResolvedSeller
                        ? 'bg-emerald-600'
                        : isResolvedBuyer
                          ? 'bg-rose-600'
                          : isUnderReview
                            ? 'bg-sky-600 animate-pulse'
                            : 'bg-amber-600',
                    )}
                  />
                  {dispute.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate sm:whitespace-normal mt-0.5">
                Closed-loop PayPal Disputes v1 defense &amp; cryptographic audit exhibit
              </p>
            </div>
          </div>
        }
        footer={
          <div className="w-full space-y-2.5">
            {/* Status Feedback Banner */}
            {isResolvedSeller && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/95 px-3.5 py-2.5 text-xs text-emerald-800 shadow-2xs">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Adjudicated: RESOLVED IN SELLER FAVOR</span>
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
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600 shrink-0" />
                  <span className="truncate">
                    Evidence Under PayPal Review (Debug ID: {dispute.paypal_debug_id || 'PENDING'})
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <PrimaryButton
                variant="primary"
                fullWidth="full"
                isDisabled={!isEvidenceReady || isSubmittingEvidence}
                onClick={handleSubmitEvidence}
                className="h-10 sm:h-10 text-xs font-bold rounded-xl shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 justify-center flex-1 cursor-pointer"
                icon={
                  isSubmittingEvidence ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                  )
                }
                title={isEvidenceReady ? 'Approve & Submit Defense' : 'Evidence Submitted'}
              />

              <PrimaryButton
                variant="secondary"
                fullWidth="full"
                isDisabled={!isEvidenceReady || isSubmittingOffer}
                onClick={() => {
                  if (dispute.recommended_offer_amount) {
                    setOfferAmount(Number(dispute.recommended_offer_amount).toFixed(2))
                  }
                  setOfferDialogOpen(true)
                }}
                className="h-10 sm:h-10 text-xs font-semibold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 justify-center sm:w-auto shrink-0 cursor-pointer"
                icon={<Award className="h-3.5 w-3.5 mr-1.5 text-amber-600" />}
                title={
                  dispute.recommended_offer_amount
                    ? `Make Offer (${formatUsd(Number(dispute.recommended_offer_amount))})`
                    : 'Make Settlement Offer'
                }
              />
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
                    onClick={() => handleAdjudicateSandbox('SELLER_FAVOR')}
                    className="flex-1 sm:flex-none text-center rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 sm:py-1 font-semibold text-[10px] sm:text-[11px] text-emerald-700 shadow-2xs hover:bg-emerald-50 active:scale-95 disabled:opacity-40 cursor-pointer transition-all"
                  >
                    {isAdjudicating ? 'Processing...' : 'Simulate Win (Seller Favor)'}
                  </button>
                  <button
                    type="button"
                    disabled={isAdjudicating || isResolvedBuyer}
                    onClick={() => handleAdjudicateSandbox('BUYER_FAVOR')}
                    className="flex-1 sm:flex-none text-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:py-1 font-semibold text-[10px] sm:text-[11px] text-slate-600 shadow-2xs hover:bg-slate-50 active:scale-95 disabled:opacity-40 cursor-pointer transition-all"
                  >
                    Simulate Concede
                  </button>
                </div>
              </div>
            )}
          </div>
        }
      >
        <div className="space-y-4 sm:space-y-5">
          {/* DISPUTE METADATA CARD */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-2xs">
            <div className="flex flex-col justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500">Disputed Fee</span>
              <div className="mt-1">
                <span className="font-mono font-extrabold text-slate-900 text-sm sm:text-base">
                  {formatUsd(disputeTotal)}
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                PayPal Hold Pending
              </span>
            </div>

            <div className="flex flex-col justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500">Reason Code</span>
              <span
                className="mt-1 font-semibold text-slate-800 text-xs sm:text-sm line-clamp-1"
                title={dispute.reason}
              >
                {dispute.reason.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                {dispute.reason}
              </span>
            </div>

            <div className="flex flex-col justify-between p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500">Cryptographic Seal</span>
              <div className="mt-1 flex items-center gap-1.5">
                {dispute.consent_verified && dispute.ledger_chain_verified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    Verified Safe
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    Review Needed
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                {dispute.ledger_entries_checked} sequential records
              </span>
            </div>

            <div className="flex flex-col justify-between p-2.5 rounded-xl bg-gradient-to-br from-indigo-50/90 to-blue-50/60 border border-indigo-100/90">
              <span className="text-[11px] font-medium text-indigo-900">Win Strength</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono font-black text-indigo-700 text-base sm:text-lg">
                  {winProbability}%
                </span>
                <span className="text-[10px] font-bold text-indigo-600">
                  {winProbability >= 80 ? 'High' : winProbability >= 60 ? 'Moderate' : 'Contested'}
                </span>
              </div>
              <span className="text-[10px] font-medium text-indigo-600/90 mt-0.5">
                Skeptic Model Score
              </span>
            </div>
          </div>

          {/* 3 AI AGENT LANES */}
          <div className="space-y-3 sm:space-y-4">
            {/* LANE 1: INVESTIGATOR (Deterministic Cryptographic Gate) */}
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
                        onClick={handleCopyDigest}
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

            {/* LANE 2: ADVOCATE (Legal Rebuttal & Bilingual Exhibit) */}
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
                      Formulates PayPal Disputes v1 defense citing verified timestamps and chat
                      proof
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
                        onClick={handleCopyRebuttal}
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
                        onClick={() => setIsRebuttalExpanded(!isRebuttalExpanded)}
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
                          &quot;I want to book braids Saturday at 3:00 PM with Selam. I accept the
                          $30 no-show fee policy.&quot;
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/80 border border-slate-200/70 p-2.5 sm:p-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                          Salon Confirmation Notice:
                        </span>
                        <p className="text-slate-700 italic break-words leading-relaxed">
                          &quot;Your appointment is confirmed. If you miss your appointment, the $30
                          deposit hold will be captured.&quot;
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LANE 3: SKEPTIC (Risk Assessment & Recommendation) */}
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
                  <span className="font-semibold text-slate-900 block mb-1">
                    Skeptic Risk Evaluation:
                  </span>
                  <RichText
                    content={
                      dispute.skeptic_critique ||
                      'Evidence meets PayPal merchant protection guidelines. Mathematical signature and continuous ledger timestamps substantiate full fee defense.'
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PDF EVIDENCE DOSSIER SECTION */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                    Cryptographic Evidence Dossier (PDF-1.4)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Pre-compiled court-ready PDF exhibit with sha256 checksums
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPdfPreview(!showPdfPreview)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 cursor-pointer transition-all"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-500" />
                  <span>{showPdfPreview ? 'Hide Preview' : 'Preview Dossier'}</span>
                </button>

                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 cursor-pointer transition-all"
                  title="Open PDF in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  <span>Open Tab</span>
                </a>

                <a
                  href={pdfUrl}
                  download={`salondesk_evidence_${dispute.paypal_dispute_id}.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-100 active:scale-95 cursor-pointer transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>

            {showPdfPreview && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner animate-in fade-in duration-200">
                <iframe
                  src={pdfUrl}
                  title="Cryptographic Dispute Evidence Dossier"
                  className="h-72 sm:h-96 md:h-[440px] w-full border-0"
                />
              </div>
            )}
          </div>
        </div>
      </CustomDrawer>

      {/* MAKE SETTLEMENT OFFER DIALOG */}
      <CustomResponsiveDialog
        open={offerDialogOpen}
        setOpen={setOfferDialogOpen}
        title="Make Dispute Settlement Offer"
        description={`Offer a partial goodwill refund to resolve dispute ${dispute.paypal_dispute_id} without seller fees.`}
        footer={
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full pt-2">
            <PrimaryButton
              variant="secondary"
              fullWidth="full"
              onClick={() => setOfferDialogOpen(false)}
              className="text-xs h-9 sm:w-auto px-4 cursor-pointer"
              title="Cancel"
            />
            <PrimaryButton
              variant="primary"
              fullWidth="full"
              isDisabled={isSubmittingOffer}
              onClick={handleMakeOffer}
              className="text-xs h-9 sm:w-auto px-5 font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-sm"
              title={isSubmittingOffer ? 'Submitting...' : 'Send Settlement Offer'}
            />
          </div>
        }
      >
        <div className="space-y-4 py-2 text-xs">
          {/* Quick Preset Amount Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-800 block">Offer Amount (USD)</label>
              <span className="text-[11px] text-slate-500 font-mono">
                Total Disputed: {formatUsd(disputeTotal)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.50"
                max={String(dispute.dispute_amount)}
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-3 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              />
            </div>

            {/* Percentage presets */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mr-0.5">
                Quick:
              </span>
              {[
                { label: '25%', value: (disputeTotal * 0.25).toFixed(2) },
                { label: '50%', value: (disputeTotal * 0.5).toFixed(2) },
                { label: '75%', value: (disputeTotal * 0.75).toFixed(2) },
                { label: 'Full', value: disputeTotal.toFixed(2) },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setOfferAmount(preset.value)}
                  className={cn(
                    'px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer',
                    offerAmount === preset.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100',
                  )}
                >
                  {preset.label} (${preset.value})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-800 block mb-1">Note to Cardholder</label>
            <textarea
              rows={3}
              value={offerNote}
              onChange={(e) => setOfferNote(e.target.value)}
              placeholder="Explain the partial refund reason or goodwill gesture..."
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs leading-relaxed"
            />
          </div>
        </div>
      </CustomResponsiveDialog>
    </>
  )
}
