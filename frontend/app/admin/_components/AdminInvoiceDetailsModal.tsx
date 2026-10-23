'use client'

import { Building2, Calendar, CheckCircle2, Copy, Info, Receipt, Send, XCircle } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/badge'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import PrimaryButton from '@/components/ui/primary-button'
import { toastColor } from '@/constant/toast-color'
import { formatUsd } from '@/lib/format'
import type { OrgCommissionInvoice } from '@/types/api-org'

interface AdminInvoiceDetailsModalProps {
  invoice: OrgCommissionInvoice | null
  orgName?: string
  open: boolean
  onClose: () => void
  onIssue: (inv: OrgCommissionInvoice) => void
  onVoid: (inv: OrgCommissionInvoice) => void
  issuing: boolean
  voiding: boolean
}

function invoiceTone(status: string): 'slate' | 'amber' | 'emerald' | 'rose' | 'sky' {
  switch ((status || '').toUpperCase()) {
    case 'PAID':
      return 'emerald'
    case 'ISSUED':
      return 'sky'
    case 'OVERDUE':
      return 'rose'
    case 'DRAFT':
      return 'slate'
    case 'VOID':
      return 'amber'
    default:
      return 'slate'
  }
}

export function AdminInvoiceDetailsModal({
  invoice,
  orgName,
  open,
  onClose,
  onIssue,
  onVoid,
  issuing,
  voiding,
}: AdminInvoiceDetailsModalProps) {
  const [copied, setCopied] = useState(false)

  if (!invoice) return null

  const status = (invoice.status || 'DRAFT').toUpperCase()
  const isDraft = status === 'DRAFT'
  const isPaid = status === 'PAID'
  const isVoid = status === 'VOID'
  const canVoid = !isPaid && !isVoid

  const handleCopyId = () => {
    void navigator.clipboard.writeText(invoice.id)
    setCopied(true)
    toast.success('Invoice UUID copied to clipboard', toastColor.success)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <CustomResponsiveDialog
      open={open}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      header={
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20">
            <Receipt className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight truncate">
                Commission Invoice
              </h3>
              <StatusBadge tone={invoiceTone(invoice.status)} size="sm">
                {invoice.status}
              </StatusBadge>
            </div>
            <p className="mt-0.5 text-slate-500 text-xs truncate">
              {orgName || `Org: ${invoice.org_id.slice(0, 8)}…`}
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Prominent Money Card */}
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-5 text-center">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Total Commission Due
          </span>
          <div className="mt-1 font-mono font-extrabold text-3xl text-emerald-950 sm:text-4xl tabular-nums">
            {formatUsd(Number(invoice.total_commission_due))}
          </div>
          <p className="mt-1 text-emerald-700 text-xs">
            Calculated from platform take-rate rules across completed captures in this billing
            cycle.
          </p>
        </div>

        {/* Invoice Info Grid */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Organization</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">{orgName || invoice.org_id.slice(0, 8)}</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400 block truncate">
              ID: {invoice.org_id}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Billing Period</span>
            <div className="flex items-center gap-1.5 font-mono text-slate-900 text-xs">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {invoice.period_start} → {invoice.period_end}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">
              Due Date: <strong>{invoice.due_date || 'Standard terms'}</strong>
            </span>
          </div>
        </div>

        {/* Informative Guidance */}
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
          <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <span className="font-semibold block">How SalonDesk SaaS billing works:</span>
            <p className="text-amber-900">
              During booking, 100% of client hold captures settle directly into the salon’s PayPal
              merchant account. This invoice bills the platform commission fee accrued over the
              cycle.
            </p>
          </div>
        </div>

        {/* Invoice UUID Chip */}
        <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-3 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Invoice Identifier
            </span>
            <span className="font-mono text-xs text-slate-700 truncate block mt-0.5">
              {invoice.id}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyId}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span>{copied ? 'Copied' : 'Copy ID'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <PrimaryButton
            title="Close"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="h-9 rounded-xl px-4 text-xs font-semibold"
            onClick={onClose}
          />

          <div className="flex items-center gap-2">
            {isDraft && (
              <PrimaryButton
                title={issuing ? 'Issuing…' : 'Issue Invoice to Salon'}
                size="sm"
                fullWidth={false}
                icon={<Send className="h-3.5 w-3.5" />}
                className="h-9 rounded-xl px-4 text-xs font-bold shadow-xs bg-sky-600 hover:bg-sky-700 text-white border-transparent"
                isLoading={issuing}
                isDisabled={issuing}
                onClick={() => {
                  onIssue(invoice)
                  onClose()
                }}
              />
            )}
            {canVoid && (
              <PrimaryButton
                title={voiding ? 'Voiding…' : 'Void Invoice'}
                variant="destructive"
                size="sm"
                fullWidth={false}
                icon={<XCircle className="h-3.5 w-3.5" />}
                className="h-9 rounded-xl px-4 text-xs font-bold shadow-xs"
                isLoading={voiding}
                isDisabled={voiding}
                onClick={() => {
                  onVoid(invoice)
                  onClose()
                }}
              />
            )}
          </div>
        </div>
      </div>
    </CustomResponsiveDialog>
  )
}
