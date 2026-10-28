'use client'

import { Building2, Calendar, CheckCircle2, FileText, Sliders, XCircle } from 'lucide-react'
import React from 'react'

import { StatusBadge } from '@/components/badge'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import type { ApiChangeRequest } from '@/types/api-org'

import { ChangeRequestReviewActions } from './ChangeRequestReviewActions'
import { PayloadParameterCard } from './PayloadParameterCard'

interface ChangeRequestDetailsModalProps {
  request: ApiChangeRequest | null
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ChangeRequestDetailsModal({
  request,
  open,
  onClose,
  onSuccess,
}: ChangeRequestDetailsModalProps) {
  if (!request) return null

  const isPending = request.status === 'PENDING'
  const isApproved = request.status === 'APPROVED'

  const typeLabel =
    request.request_type === 'PAYPAL_ACCOUNT'
      ? 'PayPal Payout Account'
      : request.request_type === 'CANCELLATION_POLICY'
        ? 'Cancellation & No-Show Policy'
        : request.request_type.replace(/_/g, ' ')

  return (
    <CustomResponsiveDialog
      open={open}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      classNameContent="sm:max-w-2xl"
      header={
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-800">
            <Sliders className="h-5 w-5 text-slate-700" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight truncate">
                {typeLabel}
              </h3>
              <StatusBadge
                tone={isPending ? 'amber' : isApproved ? 'emerald' : 'rose'}
                size="sm"
                dot
              >
                {request.status}
              </StatusBadge>
            </div>
            <p className="text-slate-500 text-xs">
              Change Request · ID: {request.id.slice(0, 12)}…
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-5 py-2">
        {/* Salon & Submission Context Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-600">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block font-semibold text-slate-500 text-[10px] uppercase">
                Salon Organization
              </span>
              <span className="font-mono text-slate-900 text-xs truncate block font-bold">
                {request.org_name || request.org_id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-600">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block font-semibold text-slate-500 text-[10px] uppercase">
                Submitted At
              </span>
              <span className="text-slate-900 text-xs font-medium">
                {new Date(request.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Human-Readable Payload Card */}
        <div>
          <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span>Proposed Policy Terms &amp; Settings</span>
          </h4>
          <PayloadParameterCard cr={request} />
        </div>

        {/* Audit Status or Action Controls */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Review &amp; Governance
          </h4>

          {isPending ? (
            <ChangeRequestReviewActions
              request={request}
              onReviewed={() => {
                onSuccess?.()
                onClose()
              }}
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs space-y-2">
              <div className="flex items-center gap-2">
                {isApproved ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )}
                <span className="font-bold text-slate-900">
                  {isApproved ? 'Approved by Administrator' : 'Rejected by Administrator'}
                </span>
                {request.reviewed_at && (
                  <span className="text-[11px] text-slate-500">
                    on {new Date(request.reviewed_at).toLocaleString()}
                  </span>
                )}
              </div>
              {request.review_notes ? (
                <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200/80">
                  &ldquo;{request.review_notes}&rdquo;
                </p>
              ) : (
                <p className="text-slate-400 text-[11px]">No reviewer notes recorded.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </CustomResponsiveDialog>
  )
}
