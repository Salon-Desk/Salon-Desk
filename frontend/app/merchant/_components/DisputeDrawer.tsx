'use client'

import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  MessageSquare,
  Scale,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { CustomDrawer } from '@/components/drawer/CustomDrawer'
import { toastColor } from '@/constant/toast-color'
import { getPortalAuthToken } from '@/lib/authSession'
import { formatUsd } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAdjudicateSandboxDisputeMutation } from '@/store/api/disputeApi'
import type { DisputeCase } from '@/types/dispute'

import { AdvocateLane, EvidenceActions, InvestigatorLane, SkepticLane } from './dispute'

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
        <EvidenceActions
          dispute={dispute}
          pdfUrl={pdfUrl}
          paypalResolutionUrl={paypalResolutionUrl}
          disputeTotal={disputeTotal}
          isResolvedSeller={isResolvedSeller}
          isResolvedBuyer={isResolvedBuyer}
          isUnderReview={isUnderReview}
          isAdjudicating={isAdjudicating}
          onAdjudicateSandbox={handleAdjudicateSandbox}
        />
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

        {/* INTERACTIVE AI RESOLUTION COPILOT — PAYPAL RESPONSE GUIDE */}
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
                  <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-[10px] font-bold">
                    Official Guide
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Follow these 4 verified steps in PayPal&apos;s Resolution Center to win this
                  chargeback.
                </p>
              </div>
            </div>
          </div>

          {/* Step 1 & 2: Tracking and Carrier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px]">
                  1
                </span>
                <span className="font-bold text-slate-900 text-xs">Tracking Number</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Paste PayPal capture / booking reference into tracking number:
              </p>
              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-200 p-2 font-mono text-xs font-semibold text-slate-800">
                <span className="truncate" title={trackingNumber}>
                  {trackingNumber}
                </span>
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

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px]">
                  2
                </span>
                <span className="font-bold text-slate-900 text-xs">Shipping Carrier</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Select &quot;Other&quot; and enter in-person fulfillment carrier:
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
        </div>

        {/* 3 AI AGENT LANES */}
        <div className="space-y-3 sm:space-y-4">
          <InvestigatorLane
            dispute={dispute}
            copiedDigest={copiedDigest}
            onCopyDigest={handleCopyDigest}
          />

          <AdvocateLane
            dispute={dispute}
            copiedRebuttal={copiedRebuttal}
            onCopyRebuttal={handleCopyRebuttal}
            isRebuttalExpanded={isRebuttalExpanded}
            onToggleRebuttalExpanded={() => setIsRebuttalExpanded(!isRebuttalExpanded)}
          />

          <SkepticLane dispute={dispute} winProbability={winProbability} />
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
