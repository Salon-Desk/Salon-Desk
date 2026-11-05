'use client'

import { format } from 'date-fns'
import {
  ArrowUpRight,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  HelpCircle,
  Percent,
  Receipt,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/badge/StatusBadge'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { toastColor } from '@/constant/toast-color'
import { formatUsd } from '@/lib/format'
import type { CommissionRecord } from '@/types/api-org'

function recordTone(status: string): 'slate' | 'amber' | 'emerald' | 'sky' {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return 'emerald'
    case 'INVOICED':
      return 'sky'
    case 'ACCRUED':
      return 'amber'
    case 'WAIVED':
      return 'slate'
    default:
      return 'slate'
  }
}

interface MerchantCommissionRecordDetailsModalProps {
  record: CommissionRecord | null
  open: boolean
  onClose: () => void
}

export function MerchantCommissionRecordDetailsModal({
  record,
  open,
  onClose,
}: MerchantCommissionRecordDetailsModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  if (!record) return null

  const handleCopy = (text: string, key: string, label: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(`${label} copied to clipboard`, toastColor.success)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const rateJson = (record.applied_rate_json || {}) as Record<string, unknown>
  const ratePercentage = rateJson.percentage ? Number(rateJson.percentage) : 5.0
  const commissionId = rateJson.commission_id ? String(rateJson.commission_id) : null

  const gross = Number(record.gross_captured_amount || 0)
  const fee = Number(record.platform_commission_amount || 0)
  const net = Number(record.net_org_amount || 0)
  const retentionPercent = gross > 0 ? ((net / gross) * 100).toFixed(0) : '95'

  let formattedDate = '—'
  let formattedTime = ''
  try {
    const d = new Date(record.created_at)
    formattedDate = format(d, 'EEEE, MMMM d, yyyy')
    formattedTime = format(d, 'h:mm a')
  } catch {
    formattedDate = record.created_at
  }

  const isAccrued = record.status?.toUpperCase() === 'ACCRUED'
  const isInvoiced = record.status?.toUpperCase() === 'INVOICED'
  const isPaid = record.status?.toUpperCase() === 'PAID'

  return (
    <CustomResponsiveDialog
      open={open}
      setOpen={(isOpen) => !isOpen && onClose()}
      classNameContent="sm:max-w-2xl w-full"
      title={
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-slate-900 truncate">
              Appointment Payment & Fee Breakdown
            </div>
            <div className="text-xs font-normal text-slate-500 truncate sm:whitespace-normal">
              Summary of client payment, your payout, and platform service fee
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4 p-1 sm:p-2">
        {/* 1. Non-Technical Human Status Explanation */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <StatusBadge tone={recordTone(record.status)} size="md">
                {record.status}
              </StatusBadge>
              <span className="text-xs font-bold text-slate-800">
                {isAccrued
                  ? 'Fee Accrued (No Immediate Payment Required)'
                  : isInvoiced
                    ? 'Added to Your Monthly Invoice'
                    : isPaid
                      ? 'Platform Fee Settled'
                      : 'Fee Status'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {formattedDate} at {formattedTime}
              </span>
            </div>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {isAccrued && (
              <>
                You <strong>do not need to pay this $10.00 fee right now</strong>. SalonDesk
                accumulates your fees in this ledger and sends you a single monthly invoice so you
                only pay once.
              </>
            )}
            {isInvoiced && (
              <>
                This fee has been included on your monthly statement. You can review and settle your
                statement in one click from the <strong>Invoices</strong> tab.
              </>
            )}
            {isPaid && (
              <>
                This fee has been successfully paid and reconciled. No further action is required.
              </>
            )}
          </p>
        </div>

        {/* 2. Visual Money Breakdown: 3 Plain-English Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Client Payment */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold text-slate-600">Client Paid</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 font-mono text-2xl font-extrabold text-slate-900">
              {formatUsd(gross)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              <span>100% in your PayPal</span>
            </div>
          </div>

          {/* Money You Keep */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-semibold text-emerald-800">
                You Keep ({retentionPercent}%)
              </span>
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 font-mono text-2xl font-extrabold text-emerald-900">
              {formatUsd(net)}
            </div>
            <div className="mt-1 text-[11px] font-medium text-emerald-700">
              Your salon&apos;s net earnings
            </div>
          </div>

          {/* SalonDesk Platform Fee */}
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-xs font-semibold text-amber-800">
                SalonDesk Fee ({ratePercentage.toFixed(0)}%)
              </span>
              <Percent className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 font-mono text-2xl font-extrabold text-amber-950">
              {formatUsd(fee)}
            </div>
            <div className="mt-1 text-[11px] font-medium text-amber-800">Standard booking fee</div>
          </div>
        </div>

        {/* 3. Helpful Explanation: "How does this work?" */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <HelpCircle className="h-4 w-4 text-amber-600" />
            <span>How does SalonDesk billing work?</span>
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-slate-600">
            <div className="flex items-start gap-2 rounded-xl bg-slate-50/60 p-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Direct PayPal Deposit:</strong> Unlike other
                platforms, client payments never go to SalonDesk first. The full amount settles
                directly into your own business PayPal account.
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-50/60 p-2.5">
              <Receipt className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">One Monthly Bill:</strong> Rather than charging
                you micro-fees on every haircut or booking, all platform fees are tallied up and
                billed together on a single statement.
              </div>
            </div>
          </div>
        </div>

        {/* 4. Direct Appointment Link */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-amber-50/40 via-white to-white p-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/70 text-amber-800">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">
                Connected Appointment Reference
              </div>
              <div className="text-xs text-slate-500 font-mono truncate">
                Booking #{record.booking_id ? record.booking_id.slice(0, 8) : '—'}
              </div>
            </div>
          </div>

          <Link
            href={`/merchant/appointments?search=${record.booking_id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-all shrink-0"
          >
            <span>View in Appointments Calendar</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 5. Collapsible Receipt & Technical Reference (For Bookkeeping / PayPal) */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100/60 transition-colors cursor-pointer gap-2"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <CreditCard className="h-4 w-4 text-slate-500 shrink-0" />
              <span className="truncate">Receipt & PayPal Reference Codes (for bookkeeping)</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
                showTechnicalDetails ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showTechnicalDetails && (
            <div className="space-y-2.5 border-t border-slate-200/70 bg-white p-4 text-xs animate-in fade-in duration-200">
              <p className="text-[11px] text-slate-500 mb-2">
                Use these transaction IDs if you need to reconcile with your PayPal business account
                or provide records to your accountant.
              </p>

              {/* PayPal Capture ID */}
              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2.5">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                    PayPal Capture Transaction ID
                  </span>
                  <div className="font-mono text-xs font-semibold text-slate-800 truncate">
                    {record.capture_id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(record.capture_id, 'capture', 'PayPal Capture ID')}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
                >
                  {copiedKey === 'capture' ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Full Booking UUID */}
              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2.5">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                    Full Booking System ID
                  </span>
                  <div className="font-mono text-xs text-slate-800 truncate">
                    {record.booking_id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(record.booking_id, 'booking', 'Booking ID')}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
                >
                  {copiedKey === 'booking' ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Ledger Record ID */}
              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2.5">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                    Ledger Entry ID
                  </span>
                  <div className="font-mono text-xs text-slate-600 truncate">{record.id}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(record.id, 'record', 'Ledger Entry ID')}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
                >
                  {copiedKey === 'record' ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Commission Rule ID if present */}
              {commissionId && (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2.5">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                      Commission Agreement Rule
                    </span>
                    <div className="font-mono text-xs text-slate-600 truncate">{commissionId}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(commissionId, 'rule', 'Rate Rule ID')}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
                  >
                    {copiedKey === 'rule' ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </CustomResponsiveDialog>
  )
}
