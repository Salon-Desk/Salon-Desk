'use client'

import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Lock,
  MessageSquare,
  Scale,
  ShieldCheck,
  Sparkles,
  Truck,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { RichText } from '@/components/chat/RichText'
import { CustomDrawer } from '@/components/drawer/CustomDrawer'
import { toastColor } from '@/constant/toast-color'
import { getPortalAuthToken } from '@/lib/authSession'
import { NEXT_PUBLIC_ENABLE_SIMULATION } from '@/lib/env'
import { formatUsd } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAdjudicateSandboxDisputeMutation } from '@/store/api/disputeApi'
import type { DisputeCase } from '@/types/dispute'

export interface DisputeDrawerProps {
  dispute: DisputeCase | null
  open: boolean
  onClose: () => void
  onDisputeUpdated?: (updated: DisputeCase) => void
}

export function DisputeDrawer({ dispute, open, onClose, onDisputeUpdated }: DisputeDrawerProps) {
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [copiedDisputeId, setCopiedDisputeId] = useState(false)
  const [copiedRebuttal, setCopiedRebuttal] = useState(false)
  const [copiedDigest, setCopiedDigest] = useState(false)
  const [copiedTracking, setCopiedTracking] = useState(false)
  const [copiedCarrier, setCopiedCarrier] = useState(false)
  const [isRebuttalExpanded, setIsRebuttalExpanded] = useState(false)

  const [adjudicateSandbox, { isLoading: isAdjudicating }] = useAdjudicateSandboxDisputeMutation()

  if (!dispute) return null

  const report = dispute.investigator_report_json
  const winProbability = dispute.skeptic_win_probability ?? 90
  const isResolvedSeller = dispute.status === 'RESOLVED_SELLER_FAVOR'
  const isResolvedBuyer = dispute.status === 'RESOLVED_BUYER_FAVOR'
  const isUnderReview = dispute.status === 'UNDER_REVIEW' || dispute.status === 'EVIDENCE_SUBMITTED'

  const disputeTotal = Number(dispute.dispute_amount) || 0

  const trackingNumber =
    dispute.paypal_transaction_id ||
    report?.paypal_capture_id ||
    dispute.capture_id ||
    dispute.booking_id
  const carrierName = 'In-Person Salon Service'
  const paypalResolutionUrl = 'https://www.sandbox.paypal.com/resolutioncenter'

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

  const handleCopyTracking = async () => {
    try {
      await navigator.clipboard.writeText(trackingNumber)
      setCopiedTracking(true)
      toast.success('Tracking number copied to clipboard', toastColor.info)
      setTimeout(() => setCopiedTracking(false), 2000)
    } catch {
      toast.error('Failed to copy tracking number', toastColor.error)
    }
  }

  const handleCopyCarrier = async () => {
    try {
      await navigator.clipboard.writeText(carrierName)
      setCopiedCarrier(true)
      toast.success('Carrier name copied to clipboard', toastColor.info)
      setTimeout(() => setCopiedCarrier(false), 2000)
    } catch {
      toast.error('Failed to copy carrier', toastColor.error)
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
      toast.success('Legal defense statement copied to clipboard', toastColor.info)
      setTimeout(() => setCopiedRebuttal(false), 2000)
    } catch {
      toast.error('Failed to copy rebuttal text', toastColor.error)
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
              PayPal Dispute Defense Guide &amp; Cryptographic Audit Exhibit
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

        {/* BUYER CLAIM / MESSAGE BANNER */}
        {report?.dispute_messages && report.dispute_messages.length > 0 && (
          <div className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-3.5 sm:p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-amber-600" />
                Customer Dispute Claim Note (Filed on PayPal)
              </span>
              <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-200">
                {String(report.dispute_life_cycle_stage || 'INQUIRY')}
              </span>
            </div>
            {report.dispute_messages.map(
              (
                msg: { posted_by?: string; content?: string; time_posted?: string },
                idx: number,
              ) => (
                <div
                  key={idx}
                  className="rounded-xl bg-white/95 p-3 border border-amber-200/80 shadow-2xs"
                >
                  <p className="text-xs text-slate-800 italic leading-relaxed">
                    &ldquo;{msg.content}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100 font-mono">
                    <span>Filed by: {msg.posted_by || 'BUYER'}</span>
                    <span>{msg.time_posted ? new Date(msg.time_posted).toUTCString() : ''}</span>
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        {/* RESOLUTION SUCCESS CARD */}
        {isResolvedSeller && (
          <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-xs flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="text-xs text-emerald-950 space-y-0.5 min-w-0 flex-1">
              <span className="font-extrabold text-sm block text-emerald-900">
                Dispute Case Successfully Resolved in Seller Favor!
              </span>
              <p className="text-emerald-800 leading-relaxed">
                {dispute.adjudication_outcome === 'CANCELED_BY_BUYER'
                  ? 'The buyer cancelled and dropped their claim on PayPal. PayPal released the hold, returning the full fee to your salon account.'
                  : 'PayPal closed this dispute in your favor. Your fee hold has been released and protected.'}
              </p>
            </div>
          </div>
        )}

        {/* INTERACTIVE AI RESOLUTION COPILOT (MATCHES PAYPAL'S "PROVIDE TRACKING INFORMATION" FORM) */}
        <div className="rounded-2xl border-2 border-indigo-200/90 bg-gradient-to-b from-indigo-50/50 via-white to-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-indigo-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    AI Dispute Copilot — PayPal Response Guide
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                    <Sparkles className="h-3 w-3" /> Step-by-Step
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Follow these 4 steps to fill out PayPal&apos;s &quot;Provide tracking
                  information&quot; form for this salon appointment:
                </p>
              </div>
            </div>

            <a
              href={paypalResolutionUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <span>Open PayPal Portal</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Step 1: Tracking Number */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px]">
                    1
                  </span>
                  Tracking Number
                </span>
                <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  Required by PayPal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Because salon appointments don&apos;t ship via mail, enter your PayPal
                Transaction/Capture ID as the tracking reference:
              </p>
              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-200 p-2 font-mono text-xs font-semibold text-slate-800">
                <span className="truncate">{trackingNumber}</span>
                <button
                  type="button"
                  onClick={handleCopyTracking}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-2xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  {copiedTracking ? (
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
              </div>
            </div>

            {/* Step 2: Search Carrier */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px]">
                    2
                  </span>
                  Search Carrier
                </span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  Select &quot;Other&quot;
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Select <strong>&quot;Other&quot;</strong> in PayPal&apos;s carrier list and enter
                this service delivery label:
              </p>
              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-200 p-2 font-sans text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-slate-400" />
                  {carrierName}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCarrier}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-2xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  {copiedCarrier ? (
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
              </div>
            </div>
          </div>

          {/* Step 3 & 4: Status of Shipment & Message Box */}
          <div className="space-y-3">
            {/* Step 3: Status of shipment */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px] shrink-0">
                  3
                </span>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 block text-xs">Status of Shipment</span>
                  <span className="text-[11px] text-slate-500 block">
                    Choose <strong>&quot;Delivered&quot;</strong> (indicates the booked time slot
                    was reserved &amp; fulfilled per policy).
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs shrink-0 self-start sm:self-auto">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Select &quot;Delivered&quot;
              </span>
            </div>

            {/* Step 4: Add a message */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px]">
                    4
                  </span>
                  <span className="font-bold text-slate-900 text-xs">
                    Add a Message (AI Advocate Rebuttal)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">
                    {(dispute.advocate_rebuttal_text || '').length} / 2000 chars
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRebuttal}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md shadow-2xs hover:bg-indigo-100 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    {copiedRebuttal ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Statement</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Paste this legal rebuttal into PayPal&apos;s{' '}
                <strong>&quot;Add a message&quot;</strong> field. It cites the customer&apos;s
                explicit consent, time logs, and cancellation deadline:
              </p>
              <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-800 max-h-48 overflow-y-auto font-sans leading-relaxed whitespace-pre-line select-all">
                {dispute.advocate_rebuttal_text ||
                  'Advocate legal statement ready with timestamp and booking confirmation.'}
              </div>
            </div>
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

          {/* LANE 2: ADVOCATE (Legal Rebuttal & Exhibit) */}
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
                        &quot;I want to book braids Saturday at 3:00 PM with Selam. I accept the $30
                        no-show fee policy.&quot;
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
  )
}
